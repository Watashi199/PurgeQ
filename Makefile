.PHONY: help install dev test lint format clean docker-up docker-down migrations

help:
	@echo "PurgeQ Development Commands"
	@echo "============================"
	@echo ""
	@echo "Backend:"
	@echo "  make install       - Install Python dependencies"
	@echo "  make dev           - Start development server"
	@echo "  make test          - Run tests"
	@echo "  make lint          - Run linting (Ruff + Black)"
	@echo "  make format        - Format code with Black"
	@echo "  make migrations    - Run database migrations"
	@echo ""
	@echo "Extension:"
	@echo "  make extension-install   - Install extension dependencies"
	@echo "  make extension-build     - Build extension"
	@echo "  make extension-lint      - Lint extension code"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-up     - Start Docker Compose services"
	@echo "  make docker-down   - Stop Docker Compose services"
	@echo "  make docker-logs   - View Docker logs"
	@echo "  make docker-build  - Build Docker image"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean         - Clean cache and build artifacts"
	@echo "  make reset-db      - Reset database (WARNING: deletes all data)"

# Backend commands
PYTHON := $(shell if command -v python3 >/dev/null 2>&1; then echo python3; elif command -v python >/dev/null 2>&1; then echo python; else echo python3; fi)

install:
	$(PYTHON) -m pip install -e ".[dev]"

dev:
	$(PYTHON) -m uvicorn api.app.main:app --reload --host 0.0.0.0 --port 8000

test:
	pytest tests/ -v --cov=api --cov-report=html

lint:
	ruff check api tests
	black --check api tests

format:
	black api tests
	ruff check --fix api tests

migrations:
	alembic upgrade head

migration-new:
	@read -p "Migration name: " name; \
	alembic revision --autogenerate -m "$$name"

migration-downgrade:
	alembic downgrade -1

# Extension commands
extension-install:
	cd extension && npm install

extension-build:
	cd extension && npm run build

extension-lint:
	cd extension && npm run lint

extension-format:
	cd extension && npm run format

# Docker commands
docker-up:
	docker-compose up -d
	@echo "✓ Services started"
	@echo "  - API: http://localhost:8000"
	@echo "  - Docs: http://localhost:8000/docs"
	@echo "  - PostgreSQL: localhost:5432"
	@echo "  - Redis: localhost:6379"

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f

docker-build:
	docker build -f docker/Dockerfile.api -t purgeq-api:latest .

# Utility commands
clean:
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	find . -type f -name ".coverage" -delete
	rm -rf .pytest_cache .mypy_cache .ruff_cache htmlcov dist build
	cd extension && rm -rf dist node_modules .next

reset-db:
	@echo "⚠️  WARNING: This will delete all data from the database!"
	@read -p "Type 'YES' to confirm: " confirm; \
	if [ "$$confirm" = "YES" ]; then \
		docker-compose exec postgres psql -U postgres -d postgres -c "DROP DATABASE IF EXISTS purgeq;" && \
		docker-compose exec postgres psql -U postgres -d postgres -c "CREATE DATABASE purgeq;" && \
		alembic upgrade head && \
		echo "✓ Database reset complete"; \
	fi

# Setup commands
setup: install docker-up migrations
	@echo "✓ PurgeQ setup complete!"
	@echo "  Run 'make dev' to start development server"

full-setup: setup extension-install extension-build
	@echo "✓ Full PurgeQ setup complete!"
	@echo "  - Backend ready at http://localhost:8000"
	@echo "  - Extension built in extension/dist/"
