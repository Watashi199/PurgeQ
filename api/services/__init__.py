"""Services layer for business logic."""
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from api.core import (
    BanlistItemNotFound,
    DuplicateItemException,
    DatabaseException,
    invalidate_banlist_cache,
    set_cache,
    get_cache,
)
from api.models import BanlistItem
from api.schemas import BanlistItemCreate, BanlistItemResponse, BanlistItemUpdate


class BanlistService:
    """Service for managing banlist operations."""

    def __init__(self, db_session: AsyncSession):
        """Initialize service with database session.

        Args:
            db_session: AsyncSession instance
        """
        self.db = db_session

    async def get_all_items(self) -> list[BanlistItemResponse]:
        """Get all banlist items with caching.

        Returns:
            list[BanlistItemResponse]: List of all banlist items
        """
        # Try to get from cache
        cached = await get_cache("banlist:all")
        if cached:
            # Cache returns already-parsed data, validate it
            return [BanlistItemResponse.model_validate(item) for item in cached]

        # Query database
        result = await self.db.execute(select(BanlistItem).order_by(BanlistItem.created_at.desc()))
        items = result.scalars().all()

        # Convert to response schema
        responses = [BanlistItemResponse.model_validate(item) for item in items]

        # Cache the result - use model_dump with mode='json' for proper serialization
        await set_cache("banlist:all", [item.model_dump(mode='json') for item in responses])

        return responses

    async def get_item_by_faceit_name(self, faceit_name: str) -> BanlistItemResponse:
        """Get banlist item by FACEIT name.

        Args:
            faceit_name: FACEIT player name

        Returns:
            BanlistItemResponse: The banlist item

        Raises:
            BanlistItemNotFound: If item not found
        """
        # Query database (case-insensitive)
        result = await self.db.execute(
            select(BanlistItem).where(
                BanlistItem.faceit_name.ilike(faceit_name)
            )
        )
        item = result.scalar_one_or_none()

        if not item:
            raise BanlistItemNotFound(f"Banlist item with name '{faceit_name}' not found")

        return BanlistItemResponse.model_validate(item)

    async def create_item(self, create_schema: BanlistItemCreate) -> BanlistItemResponse:
        """Create new banlist item.

        Args:
            create_schema: BanlistItemCreate schema

        Returns:
            BanlistItemResponse: Created item

        Raises:
            DuplicateItemException: If FACEIT name already exists
            DatabaseException: If database error occurs
        """
        # Check if already exists (case-insensitive)
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
            # Create new item
            db_item = BanlistItem(
                id=str(uuid4()),
                faceit_name=create_schema.faceit_name,
                reason=create_schema.reason,
                author=create_schema.author,
            )

            self.db.add(db_item)
            await self.db.commit()
            await self.db.refresh(db_item)

            # Invalidate cache
            await invalidate_banlist_cache()

            return BanlistItemResponse.model_validate(db_item)
        except IntegrityError as e:
            await self.db.rollback()
            raise DatabaseException(f"Database integrity error: {str(e)}")
        except Exception as e:
            await self.db.rollback()
            raise DatabaseException(f"Failed to create banlist item: {str(e)}")

    async def update_item(
        self, faceit_name: str, update_schema: BanlistItemUpdate
    ) -> BanlistItemResponse:
        """Update banlist item.

        Args:
            faceit_name: FACEIT player name
            update_schema: BanlistItemUpdate schema

        Returns:
            BanlistItemResponse: Updated item

        Raises:
            BanlistItemNotFound: If item not found
            DatabaseException: If database error occurs
        """
        try:
            # Find item
            result = await self.db.execute(
                select(BanlistItem).where(
                    BanlistItem.faceit_name.ilike(faceit_name)
                )
            )
            db_item = result.scalar_one_or_none()

            if not db_item:
                raise BanlistItemNotFound(f"Banlist item with name '{faceit_name}' not found")

            # Update fields
            update_data = update_schema.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_item, field, value)

            await self.db.commit()
            await self.db.refresh(db_item)

            # Invalidate cache
            await invalidate_banlist_cache()

            return BanlistItemResponse.model_validate(db_item)
        except BanlistItemNotFound:
            raise
        except Exception as e:
            await self.db.rollback()
            raise DatabaseException(f"Failed to update banlist item: {str(e)}")

    async def delete_item(self, faceit_name: str) -> bool:
        """Delete banlist item.

        Args:
            faceit_name: FACEIT player name

        Returns:
            bool: True if deleted

        Raises:
            BanlistItemNotFound: If item not found
            DatabaseException: If database error occurs
        """
        try:
            # Find item
            result = await self.db.execute(
                select(BanlistItem).where(
                    BanlistItem.faceit_name.ilike(faceit_name)
                )
            )
            db_item = result.scalar_one_or_none()

            if not db_item:
                raise BanlistItemNotFound(f"Banlist item with name '{faceit_name}' not found")

            # Delete
            await self.db.delete(db_item)
            await self.db.commit()

            # Invalidate cache
            await invalidate_banlist_cache()

            return True
        except BanlistItemNotFound:
            raise
        except Exception as e:
            await self.db.rollback()
            raise DatabaseException(f"Failed to delete banlist item: {str(e)}")

    async def get_banlist_map(self) -> dict[str, dict]:
        """Get banlist as optimized map for O(1) lookup.

        Returns:
            dict: Map with FACEIT name as key (lowercase) and item data as value
        """
        # Try to get from cache
        cached = await get_cache("banlist:map")
        if cached:
            return cached

        items = await self.get_all_items()

        # Create lowercase map for case-insensitive lookup
        banlist_map = {
            item.faceit_name.lower(): {
                "id": item.id,
                "faceit_name": item.faceit_name,
                "reason": item.reason,
                "author": item.author,
                "created_at": item.created_at.isoformat(),
                "updated_at": item.updated_at.isoformat(),
            }
            for item in items
        }

        # Cache the map
        await set_cache("banlist:map", banlist_map)

        return banlist_map

    async def health_check(self) -> bool:
        """Check database connection.

        Returns:
            bool: True if database is accessible
        """
        try:
            await self.db.execute(select(1))
            return True
        except Exception:
            return False
