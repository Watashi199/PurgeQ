# PurgeQ - FACEIT Banlist Platform

A production-ready monorepo containing a FastAPI backend and Chrome/Firefox extension for managing a real-time FACEIT player banlist.

## Features

### Backend
- ✅ REST API with async SQLAlchemy ORM
- ✅ PostgreSQL database with async support
- ✅ Redis caching and rate limiting
- ✅ API key authentication
- ✅ Comprehensive validation with Pydantic v2
- ✅ OpenAPI/Swagger documentation
- ✅ Alembic migrations
- ✅ Complete test suite with pytest
- ✅ Docker containerization
- ✅ Health check endpoints

### Extension
- ✅ Manifest V3 compatible (Chrome, Firefox)
- ✅ Real-time player detection via MutationObserver
- ✅ Banned player highlighting with tooltips
- ✅ Offline support with cached data
- ✅ Auto-refresh every 60 seconds
- ✅ React popup UI
- ✅ O(1) player lookup with Map structure
- ✅ Dark mode support

## Project Structure

```
/banlist-platform
├── api/                      # FastAPI backend
│   ├── app/                 # Application factory
│   ├── models/              # SQLAlchemy models
│   ├── schemas/             # Pydantic schemas
│   ├── routers/             # API endpoints
│   ├── services/            # Business logic
│   └── core/                # Core utilities
├── extension/               # Chrome/Firefox extension
│   ├── manifest.json        # Extension manifest
│   ├── src/
│   │   ├── content/         # Content script
│   │   ├── background/      # Service worker
│   │   ├── popup/           # React popup UI
│   │   └── shared/          # Shared utilities
│   └── package.json         # Dependencies
├── docker/                  # Docker configurations
├── migrations/              # Alembic migrations
├── tests/                   # Test suite
├── .github/workflows/       # CI/CD workflows
├── pyproject.toml          # Python dependencies
├── docker-compose.yml      # Docker Compose setup
└── .env.example            # Environment variables
```

## Quick Start

### Prerequisites
- Python 3.12+
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 16+ (or use Docker Compose)
- Redis (or use Docker Compose)

### Backend Setup

1. **Clone the repository**
```bash
git clone <repository>
cd banlist-platform
```

2. **Copy environment file**
```bash
cp .env.example .env
```

3. **Install Python dependencies**
```bash
pip install -e ".[dev]"
# or
pip install -r requirements.txt
```

4. **Start Docker services**
```bash
docker-compose up -d
```

5. **Run migrations**
```bash
alembic upgrade head
```

6. **Start development server**
```bash
uvicorn api.app.main:app --reload --host 0.0.0.0 --port 8000
```

Access API at `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Extension Setup

1. **Install dependencies**
```bash
cd extension
npm install
```

2. **Build extension**
```bash
npm run build
```

3. **Load in browser**
   - **Chrome**: Open `chrome://extensions/` → Enable "Developer mode" → "Load unpacked" → select `dist/` folder
   - **Firefox**: Open `about:debugging#/runtime/this-firefox` → "Load Temporary Add-on" → select any file from `dist/`

## API Endpoints

### Public Endpoints
- `GET /` - Root endpoint
- `GET /health` - Health check
- `GET /docs` - Swagger documentation

### Banlist Endpoints (Require API Key)

**Get all banned players:**
```bash
curl -X GET http://localhost:8000/api/v1/banlist \
  -H "X-API-Key: your-api-key"
```

**Add player to banlist:**
```bash
curl -X POST http://localhost:8000/api/v1/ban \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "faceit_name": "PlayerName",
    "reason": "Cheating",
    "author": "AdminBot"
  }'
```

**Remove player from banlist:**
```bash
curl -X DELETE http://localhost:8000/api/v1/ban/PlayerName \
  -H "X-API-Key: your-api-key"
```

## Environment Variables

Key variables in `.env`:

```env
# Database
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/purgeq

# Redis
REDIS_URL=redis://localhost:6379/0

# API
VALID_API_KEYS=key1,key2,key3
DEBUG=false

# Extension
REACT_APP_API_URL=https://api.example.com
```

## Testing

### Backend Tests
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=api --cov-report=html

# Run specific test file
pytest tests/test_service.py -v
```

### Linting & Formatting
```bash
# Lint with Ruff
ruff check api tests

# Format with Black
black api tests

# Type checking
mypy api
```

### Extension Tests
```bash
cd extension

# Lint
npm run lint

# Format check
npm run format -- --check

# Type check
npm run type-check
```

## Docker Deployment

### Build and run with Docker Compose
```bash
docker-compose up -d
```

### Build custom image
```bash
docker build -f docker/Dockerfile.api -t purgeq-api:latest .
```

### Run image
```bash
docker run -p 8000:8000 \
  -e DATABASE_URL=postgresql://... \
  -e REDIS_URL=redis://... \
  purgeq-api:latest
```

## Database Migrations

### Create new migration
```bash
alembic revision --autogenerate -m "Description of changes"
```

### Apply migrations
```bash
alembic upgrade head
```

### Rollback
```bash
alembic downgrade -1
```

## CI/CD

GitHub Actions workflows:
- `ci-cd.yml` - Runs tests, linting, builds Docker image
- `release.yml` - Creates releases on tag push

### Workflow Steps
1. Backend tests (pytest, Ruff, Black, Mypy)
2. Extension build and lint
3. Docker image build and push
4. Security scanning with Trivy
5. Optional deployment to production

## Performance Optimizations

### Backend
- **Async/await** for non-blocking database operations
- **Connection pooling** with SQLAlchemy
- **Redis caching** for banlist (1 hour TTL)
- **O(1) lookups** with Map structure
- **Rate limiting** with Redis sliding window
- **Index** on faceit_name for fast queries

### Extension
- **MutationObserver** for efficient DOM monitoring
- **Local storage** for offline support
- **Background refresh** every 60 seconds
- **Debounced** player name scanning
- **Map-based** O(1) lookup for banned players

## Security Considerations

✅ **API Security:**
- API key authentication via X-API-Key header
- Rate limiting (100 requests/60s by default)
- SQL injection prevention with SQLAlchemy ORM
- CORS configuration
- Input validation with Pydantic
- Async connections to prevent blocking

✅ **Extension Security:**
- Content Security Policy in manifest
- No eval() or inline scripts
- Safe DOM manipulation
- Proper error handling

⚠️ **TODO:**
- Add JWT tokens for better auth
- Implement HTTPS enforcement
- Add request logging and monitoring
- Set up database backups

## Troubleshooting

### Port already in use
```bash
# Free up port 8000
lsof -ti:8000 | xargs kill -9
```

### Database connection refused
```bash
# Check PostgreSQL is running
docker-compose ps
docker-compose logs postgres
```

### Extension not loading
1. Check manifest version (must be 3)
2. Verify all file paths in manifest.json
3. Check browser console for errors
4. Try hard-refresh and reload

## Contributing

1. Create feature branch: `git checkout -b feature/name`
2. Commit changes: `git commit -am 'Add feature'`
3. Run tests: `pytest && cd extension && npm run lint`
4. Push: `git push origin feature/name`
5. Create Pull Request

## License

MIT License - See LICENSE file

## Support

For issues and questions:
- GitHub Issues
- Documentation: `/docs` endpoint
- Email: support@example.com
