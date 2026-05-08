"""Services layer for business logic."""
import logging
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from api.core import (
    BanlistItemNotFound,
    DatabaseException,
    DuplicateItemException,
    get_cache,
    invalidate_banlist_cache,
    set_cache,
)
from api.models import BanlistItem
from api.schemas import BanlistItemCreate, BanlistItemResponse

logger = logging.getLogger(__name__)


class BanlistService:
    """Service for managing banlist operations."""

    def __init__(self, db_session: AsyncSession):
        self.db = db_session

    async def get_all_items(self) -> list[BanlistItemResponse]:
        """Get all banlist items, served from cache when available."""
        cached = await get_cache("banlist:all")
        if cached:
            return [BanlistItemResponse.model_validate(item) for item in cached]

        result = await self.db.execute(
            select(BanlistItem).order_by(BanlistItem.created_at.desc())
        )
        items = result.scalars().all()
        responses = [BanlistItemResponse.model_validate(item) for item in items]

        await set_cache(
            "banlist:all",
            [item.model_dump(mode="json") for item in responses],
        )
        return responses

    async def get_item_by_faceit_name(self, faceit_name: str) -> BanlistItemResponse:
        """Look up a banlist item by FACEIT name (case-insensitive)."""
        result = await self.db.execute(
            select(BanlistItem).where(BanlistItem.faceit_name.ilike(faceit_name))
        )
        item = result.scalar_one_or_none()
        if not item:
            raise BanlistItemNotFound(
                f"Banlist item with name '{faceit_name}' not found"
            )
        return BanlistItemResponse.model_validate(item)

    async def create_item(
        self, create_schema: BanlistItemCreate
    ) -> BanlistItemResponse:
        """Create a banlist item, rejecting duplicates."""
        existing = await self.db.execute(
            select(BanlistItem).where(
                BanlistItem.faceit_name.ilike(create_schema.faceit_name)
            )
        )
        if existing.scalar_one_or_none():
            raise DuplicateItemException(
                f"FACEIT name '{create_schema.faceit_name}' is already in banlist"
            )

        try:
            db_item = BanlistItem(
                id=str(uuid4()),
                faceit_name=create_schema.faceit_name,
                reason=create_schema.reason,
                author=create_schema.author,
            )
            self.db.add(db_item)
            await self.db.commit()
            await self.db.refresh(db_item)
            await invalidate_banlist_cache()
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
        """Delete a banlist item by FACEIT name."""
        result = await self.db.execute(
            select(BanlistItem).where(BanlistItem.faceit_name.ilike(faceit_name))
        )
        db_item = result.scalar_one_or_none()
        if not db_item:
            raise BanlistItemNotFound(
                f"Banlist item with name '{faceit_name}' not found"
            )

        try:
            await self.db.delete(db_item)
            await self.db.commit()
            await invalidate_banlist_cache()
            return True
        except SQLAlchemyError:
            await self.db.rollback()
            logger.exception("Database error while deleting banlist item")
            raise DatabaseException("Failed to delete banlist item")

    async def health_check(self) -> bool:
        """Verify the database connection is alive."""
        try:
            await self.db.execute(select(1))
            return True
        except SQLAlchemyError:
            return False
