# PurgeQ - Quick Start Guide

## 🚀 5-Minute Setup

### Option 1: Automated Setup (Linux/macOS)

```bash
# Make setup script executable
chmod +x setup.sh

# Run setup
./setup.sh

# Start services
make docker-up

# Start dev server
make dev
```

Then open http://localhost:8000/docs

### Option 2: Manual Setup

#### Step 1: Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Install Python dependencies
pip install -e ".[dev]"

# Install Node dependencies (for extension)
cd extension && npm install && cd ..
```

#### Step 2: Start Services
```bash
# Start Docker services (PostgreSQL, Redis)
docker-compose up -d

# Verify services are running
docker-compose ps
```

#### Step 3: Initialize Database
```bash
# Run migrations
alembic upgrade head
```

#### Step 4: Start API Server
```bash
# In a new terminal
uvicorn api.app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Step 5: Build Extension
```bash
cd extension
npm run build
cd ..
```

## 📋 Verify Installation

### Backend Check
```bash
# Should return 200 with health status
curl http://localhost:8000/health | jq

# Should show API docs
open http://localhost:8000/docs
```

### Extension Check
```bash
# Check built files
ls -la extension/dist/

# Should have manifest.json, popup.html, and JavaScript files
```

## 📖 Common Tasks

### Add Player to Banlist
```bash
curl -X POST http://localhost:8000/api/v1/ban \
  -H "X-API-Key: test-key-1" \
  -H "Content-Type: application/json" \
  -d '{
    "faceit_name": "SuspiciousPlayer",
    "reason": "Aimbotting detected",
    "author": "AdminBot"
  }'
```

### Get All Banned Players
```bash
curl http://localhost:8000/api/v1/banlist \
  -H "X-API-Key: test-key-1" | jq
```

### Remove Player
```bash
curl -X DELETE http://localhost:8000/api/v1/ban/SuspiciousPlayer \
  -H "X-API-Key: test-key-1"
```

### Run Tests
```bash
# Backend tests
pytest tests/ -v

# With coverage
pytest tests/ --cov=api --cov-report=html

# Extension linting
cd extension && npm run lint && cd ..
```

### Format Code
```bash
# Backend
make format

# Extension
cd extension && npm run format && cd ..
```

## 🐳 Docker Compose Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down

# Reset database (WARNING: deletes all data)
docker-compose exec postgres psql -U postgres -c "DROP DATABASE purgeq; CREATE DATABASE purgeq;"
```

## 📁 Project Structure

```
PurgeQ/
├── api/                    # FastAPI backend
│   ├── app/               # Application factory
│   ├── core/              # Configuration, database, security
│   ├── models/            # SQLAlchemy ORM models
│   ├── schemas/           # Pydantic validation
│   ├── services/          # Business logic (BanlistService)
│   └── routers/           # API endpoints
├── extension/              # Chrome/Firefox extension
│   ├── manifest.json      # Extension manifest (MV3)
│   └── src/
│       ├── background/    # Service worker
│       ├── content/       # Content script
│       ├── popup/         # React popup UI
│       └── shared/        # Utilities
├── tests/                  # Pytest test suite
├── migrations/             # Alembic database migrations
├── docker/                 # Docker configuration
│   └── Dockerfile.api     # API Dockerfile
├── .github/workflows/      # CI/CD workflows
├── docker-compose.yml      # Development environment
├── pyproject.toml          # Python dependencies
└── .env.example            # Environment template
```

## 🔑 API Key Setup

### Development (Already Configured)
API keys in `.env`:
```env
VALID_API_KEYS=test-key-1,test-key-2
```

Use in requests:
```bash
curl -H "X-API-Key: test-key-1" http://localhost:8000/api/v1/banlist
```

### Production
1. Generate secure keys
2. Update `.env.production`
3. Store securely (AWS Secrets Manager, HashiCorp Vault, etc.)

## 🔍 Debugging

### Enable Debug Logging
```bash
# Modify .env
DEBUG=true
DB_ECHO=true
```

### Check Database
```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d purgeq

# View tables
\dt

# Query banlist
SELECT * FROM banlist_items;
```

### Check Redis
```bash
# Connect to Redis
docker-compose exec redis redis-cli

# View cache keys
KEYS "banlist:*"

# Check cache content
GET "banlist:all"
```

### View API Logs
```bash
# Watch API logs
docker-compose logs -f api

# Or use Uvicorn directly
uvicorn api.app.main:app --log-level debug
```

## 🛠️ Development Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Make Changes** in relevant files

3. **Run Tests**
   ```bash
   make test
   ```

4. **Format Code**
   ```bash
   make format
   ```

5. **Commit & Push**
   ```bash
   git add .
   git commit -m "Add new feature"
   git push origin feature/new-feature
   ```

## 📚 Documentation

- **Architecture**: See [ARCHITECTURE.md](ARCHITECTURE.md)
- **Deployment**: See [DEPLOYMENT.md](DEPLOYMENT.md)
- **Full README**: See [README.md](README.md)
- **API Docs**: http://localhost:8000/docs (Swagger)

## 🚨 Common Issues

### "Port 8000 already in use"
```bash
# Find process on port 8000
lsof -i :8000

# Kill process
kill -9 <PID>
```

### "Database connection refused"
```bash
# Ensure Docker services are running
docker-compose ps

# Restart PostgreSQL
docker-compose restart postgres
```

### "Module not found" errors
```bash
# Reinstall dependencies
pip install -e ".[dev]"

# Clear Python cache
find . -type d -name __pycache__ -exec rm -rf {} +
```

### Extension not detecting players
1. Verify content script loaded: Check browser console
2. Verify API is running: curl http://localhost:8000/health
3. Verify cache has data: `redis-cli GET "banlist:all"`

## 📞 Support

For issues:
1. Check logs: `docker-compose logs`
2. Review [ARCHITECTURE.md](ARCHITECTURE.md) for design details
3. Check test files for usage examples
4. Review [README.md](README.md) for comprehensive docs

## 🎯 Next Steps

- [ ] Run `make dev` to start dev server
- [ ] Visit http://localhost:8000/docs
- [ ] Add test banlist items via API
- [ ] Build and load extension in browser
- [ ] Test detection on FACEIT pages
- [ ] Read [DEPLOYMENT.md](DEPLOYMENT.md) for production setup
- [ ] Review [ARCHITECTURE.md](ARCHITECTURE.md) for system design

---

**Happy coding! 🎉**
