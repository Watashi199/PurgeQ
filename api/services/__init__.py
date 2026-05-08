"""Services layer for business logic."""
import logging
from uuid import UUID, uuid4

from pydantic import ValidationError
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
from api.schemas import (
    BanlistImportFailure,
    BanlistImportItem,
    BanlistImportRequest,
    BanlistImportResult,
    BanlistItemCreate,
    BanlistItemResponse,
)

logger = logging.getLogger(__name__)


def _describe(raw: BanlistImportItem | str) -> str:
    """Stringify an import row for inclusion in a failure report."""
    if isinstance(raw, str):
        return raw
    return raw.faceit_name or ""


def _first_error(exc: ValidationError) -> str:
    """Pull the first user-facing message out of a Pydantic ValidationError."""
    errors = exc.errors()
    if not errors:
        return "validation error"
    msg = errors[0].get("msg") or "validation error"
    return msg.removeprefix("Value error, ")


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

    async def bulk_import(self, payload: BanlistImportRequest) -> BanlistImportResult:
        """Import a batch of items into this namespace.

        Behaviour:
        - Bare strings or rows missing fields are filled with `default_reason`
          / `default_author` from the request.
        - Each row is validated through `BanlistItemCreate`; rows that fail
          land in `failed[]` with a short reason instead of aborting the
          batch.
        - Items already present in the namespace are reported in `skipped[]`.
        - Successful inserts are committed in one transaction; on a DB error
          we roll back and surface a `DatabaseException`.
        """
        result = BanlistImportResult()

        # Snapshot existing names once to dedupe both against the DB and
        # against earlier rows in the same payload.
        existing = await self.db.execute(
            select(BanlistItem.faceit_name).where(
                BanlistItem.namespace_id == str(self.namespace_id)
            )
        )
        seen_names = {name.lower() for (name,) in existing.all()}
        new_rows: list[BanlistItem] = []

        for raw in payload.items:
            try:
                normalized = self._normalize_import_row(raw, payload)
            except ValueError as e:
                result.failed.append(
                    BanlistImportFailure(input=_describe(raw), reason=str(e))
                )
                continue

            try:
                create_schema = BanlistItemCreate(**normalized)
            except ValidationError as e:
                result.failed.append(
                    BanlistImportFailure(
                        input=_describe(raw),
                        reason=_first_error(e),
                    )
                )
                continue

            key = create_schema.faceit_name.lower()
            if key in seen_names:
                result.skipped.append(create_schema.faceit_name)
                continue
            seen_names.add(key)

            new_rows.append(
                BanlistItem(
                    id=str(uuid4()),
                    namespace_id=str(self.namespace_id),
                    faceit_name=create_schema.faceit_name,
                    reason=create_schema.reason,
                    author=create_schema.author,
                )
            )

        if not new_rows:
            return result

        try:
            self.db.add_all(new_rows)
            await self.db.commit()
            await invalidate_banlist_cache(self.namespace_id)
            result.imported = len(new_rows)
            return result
        except IntegrityError:
            # Could happen if a concurrent request raced with us on the same
            # name. Fall back to per-row inserts so the rest of the batch
            # still goes through.
            await self.db.rollback()
            return await self._import_one_by_one(new_rows, result)
        except SQLAlchemyError:
            await self.db.rollback()
            logger.exception("Database error during bulk import")
            raise DatabaseException("Failed to import banlist")

    @staticmethod
    def _normalize_import_row(
        raw: BanlistImportItem | str, payload: BanlistImportRequest
    ) -> dict:
        """Coerce a raw import row into a `BanlistItemCreate` kwargs dict."""
        if isinstance(raw, str):
            faceit_name = raw.strip()
            reason = None
            author = None
        else:
            faceit_name = (raw.faceit_name or "").strip()
            reason = (raw.reason or "").strip() or None
            author = (raw.author or "").strip() or None

        if not faceit_name:
            raise ValueError("missing faceit_name")

        return {
            "faceit_name": faceit_name,
            "reason": reason or payload.default_reason,
            "author": author or payload.default_author,
        }

    async def _import_one_by_one(
        self, rows: list[BanlistItem], result: BanlistImportResult
    ) -> BanlistImportResult:
        for row in rows:
            try:
                self.db.add(row)
                await self.db.commit()
                result.imported += 1
            except IntegrityError:
                await self.db.rollback()
                result.skipped.append(row.faceit_name)
            except SQLAlchemyError:
                await self.db.rollback()
                logger.exception("Database error during fallback import")
                result.failed.append(
                    BanlistImportFailure(
                        input=row.faceit_name, reason="database error"
                    )
                )
        if result.imported:
            await invalidate_banlist_cache(self.namespace_id)
        return result

    async def _fetch_by_name(self, faceit_name: str) -> BanlistItem | None:
        result = await self.db.execute(
            select(BanlistItem).where(
                BanlistItem.namespace_id == str(self.namespace_id),
                BanlistItem.faceit_name.ilike(faceit_name),
            )
        )
        return result.scalar_one_or_none()
