"""Services layer for business logic."""
import logging
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from api.core import (
    BanlistItemNotFound,
    DatabaseException,
    DuplicateItemException,
    get_cache,
    set_cache,
)
from api.core.cache import banlist_cache_key, invalidate_banlist_cache
from api.models import BanlistItem
from api.schemas import BanlistItemCreate, BanlistItemResponse

logger = logging.getLogger(__name__)


class BanlistService:
    """Service for managing banlist operations within a single namespace."""

    def __init__(self, db_session: AsyncSession, namespace_id: UUID):
        self.db = db_session
        self.namespace_id = namespace_id

    async def get_all_items(self) -> list[BanlistItemResponse]:
        """Get all banlist items for the current namespace, with cache."""
        cache_key = banlist_cache_key(self.namespace_id)
        cached = await get_cache(cache_key)
        if cached:
            return [BanlistItemResponse.model_validate(item) for item in cached]

        result = await self.db.execute(
            select(BanlistItem)
            .where(BanlistItem.namespace_id == str(self.namespace_id))
            .order_by(BanlistItem.created_at.desc())
        )
        items = result.scalars().all()
        responses = [BanlistItemResponse.model_validate(item) for item in items]

        await set_cache(
            cache_key,
            [item.model_dump(mode="json") for item in responses],
        )
        return responses

    async def get_item_by_faceit_name(self, faceit_name: str) -> BanlistItemResponse:
        """Look up a banlist item by name in this namespace (case-insensitive)."""
        item = await self._fetch_by_name(faceit_name)
        if not item:
            raise BanlistItemNotFound(
                f"Banlist item with name '{faceit_name}' not found"
            )
        return BanlistItemResponse.model_validate(item)

    async def create_item(
        self, create_schema: BanlistItemCreate
    ) -> BanlistItemResponse:
        """Create a banlist item, rejecting duplicates within the namespace."""
        if await self._fetch_by_name(create_schema.faceit_name):
            raise DuplicateItemException(
                f"FACEIT name '{create_schema.faceit_name}' is already in banlist"
            )

        try:
            db_item = BanlistItem(
                id=str(uuid4()),
                namespace_id=str(self.namespace_id),
                faceit_name=create_schema.faceit_name,
                reason=create_schema.reason,
                author=create_schema.author,
            )
            self.db.add(db_item)
            await self.db.commit()
            await self.db.refresh(db_item)
            await invalidate_banlist_cache(self.namespace_id)
            return BanlistItemResponse.model_validate(db_item)
        except IntegrityError:
            await self.db.rollback()
            logger.exception("Integrity error while creating banlist item")
            raise DuplicateItemException(
                f"FACEIT name '{create_schema.faceit_name}' is already in banlist"
            )
        except SQLAlchemyError:
            await self.db.rollback()
            logger.exception("Database error while creating banlist item")
            raise DatabaseException("Failed to create banlist item")

    async def delete_item(self, faceit_name: str) -> bool:
        """Delete a banlist item by name from this namespace."""
        db_item = await self._fetch_by_name(faceit_name)
        if not db_item:
            raise BanlistItemNotFound(
                f"Banlist item with name '{faceit_name}' not found"
            )

        try:
            await self.db.delete(db_item)
            await self.db.commit()
            await invalidate_banlist_cache(self.namespace_id)
            return True
        except SQLAlchemyError:
            await self.db.rollback()
            logger.exception("Database error while deleting banlist item")
            raise DatabaseException("Failed to delete banlist item")

    async def health_check(self) -> bool:
        try:
            await self.db.execute(select(1))
            return True
        except SQLAlchemyError:
            return False

    async def _fetch_by_name(self, faceit_name: str) -> BanlistItem | None:
        result = await self.db.execute(
            select(BanlistItem).where(
                BanlistItem.namespace_id == str(self.namespace_id),
                BanlistItem.faceit_name.ilike(faceit_name),
            )
        )
        return result.scalar_one_or_none()
