# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-05-05

### Added
- Initial release of PurgeQ FACEIT banlist platform
- FastAPI backend with async SQLAlchemy ORM
- PostgreSQL database integration
- Redis caching and rate limiting
- API key authentication
- Comprehensive Pydantic v2 validation
- OpenAPI/Swagger documentation
- Alembic database migrations
- Complete pytest test suite with coverage reporting
- Docker containerization and Docker Compose setup
- Health check endpoints
- Chrome/Firefox MV3 compatible extension
- Real-time player detection via MutationObserver
- Banned player highlighting with tooltips
- Offline support with local caching
- React popup UI with search and management features
- GitHub Actions CI/CD workflows
- Comprehensive documentation (README, ARCHITECTURE, DEPLOYMENT, QUICKSTART)
- Development tools: Ruff linting, Black formatting, MyPy type checking
- ESLint and Prettier for TypeScript/React code
- Makefile for common commands
- Production deployment guides (Docker, Kubernetes, AWS ECS, Nginx)

### Features

#### Backend
- ✅ REST API with async/await support
- ✅ PostgreSQL with connection pooling
- ✅ Redis caching with TTL management
- ✅ Sliding window rate limiting
- ✅ API key authentication
- ✅ Case-insensitive player name lookup
- ✅ Automatic duplicate detection
- ✅ Cache invalidation on writes
- ✅ Health check endpoint
- ✅ Comprehensive error handling

#### Extension
- ✅ Manifest V3 support (Chrome, Firefox)
- ✅ Content script with MutationObserver
- ✅ Background service worker with periodic refresh
- ✅ React popup UI with TypeScript
- ✅ Local storage for offline support
- ✅ O(1) player lookup with Map
- ✅ Visual banned player indicators
- ✅ Interactive tooltips with ban details
- ✅ Dark mode support
- ✅ Debounced DOM scanning

#### Infrastructure
- ✅ Docker Compose for local development
- ✅ Docker containerization for production
- ✅ Alembic database migrations
- ✅ GitHub Actions CI/CD pipeline
- ✅ Security scanning with Trivy
- ✅ Automated testing and linting
- ✅ Docker image building and pushing

### Security
- API key authentication via X-API-Key header
- Input validation with Pydantic
- SQL injection prevention with ORM
- Rate limiting with configurable limits
- CORS support
- Content Security Policy in extension

### Performance
- Async database operations
- Redis caching (1 hour TTL)
- O(1) player ban lookup
- Connection pooling
- Debounced DOM monitoring
- Lazy style injection

### Documentation
- README with features and setup
- QUICKSTART guide for 5-minute setup
- ARCHITECTURE document with design details
- DEPLOYMENT guide for production
- CONTRIBUTING guide for developers
- API documentation via Swagger/ReDoc
- Inline code documentation

---

## Older Versions

Project started at v1.0.0 - 2026-05-05
