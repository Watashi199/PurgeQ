# PurgeQ Architecture

## System Overview

PurgeQ is a distributed banlist management system for FACEIT players. It consists of three main components:

1. **Backend API** - FastAPI async service
2. **Database** - PostgreSQL with async operations
3. **Extension** - Chrome/Firefox browser extension
4. **Cache/Rate Limit** - Redis

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser Extension                         │
│  ┌──────────────┬──────────────┬─────────────────────────┐  │
│  │ Content      │ Background   │ Popup                   │  │
│  │ Script       │ Worker       │ (React UI)              │  │
│  └──────┬───────┴──────┬───────┴──────┬──────────────────┘  │
│         │              │              │                     │
│         └──────────────┼──────────────┘                     │
└──────────────────────────┼────────────────────────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   FastAPI Backend                            │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Routers (API v1)                                        │ │
│  │  • GET    /api/v1/banlist                              │ │
│  │  • POST   /api/v1/ban                                  │ │
│  │  • DELETE /api/v1/ban/{faceit_name}                    │ │
│  │  • GET    /health                                      │ │
│  └──────────────┬────────────────────────────────────────┘ │
│                 │                                           │
│  ┌──────────────▼────────────────────────────────────────┐ │
│  │ Services Layer (Business Logic)                        │ │
│  │  • BanlistService                                      │ │
│  │    - Async CRUD operations                             │ │
│  │    - Cache management                                  │ │
│  │    - Data validation                                   │ │
│  └──────────────┬────────────────────────────────────────┘ │
│                 │                                           │
│  ┌──────────────▼────────────────────────────────────────┐ │
│  │ Core Modules                                           │ │
│  │  • Config         - Settings management                │ │
│  │  • Database       - SQLAlchemy async setup             │ │
│  │  • Cache          - Redis operations                   │ │
│  │  • Security       - API key validation                 │ │
│  │  • Rate Limiting  - Redis-based rate limiter          │ │
│  │  • Exceptions     - Custom exception hierarchy        │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────┬───────────────────────────┬──────────────────────┘
           │                           │
           ▼                           ▼
    ┌─────────────────┐        ┌──────────────────┐
    │   PostgreSQL    │        │     Redis        │
    │  (Banlist DB)   │        │  (Cache/Limits)  │
    └─────────────────┘        └──────────────────┘
```

## Components

### Backend Architecture

#### 1. API Layer (Routers)
- Handles HTTP requests/responses
- Validates headers and parameters
- Delegates business logic to services
- Manages authentication and rate limiting

#### 2. Service Layer
- **BanlistService**: All banlist operations
  - `get_all_items()` - Fetch with caching
  - `get_item_by_faceit_name()` - Case-insensitive lookup
  - `create_item()` - Add with duplicate check
  - `update_item()` - Modify details
  - `delete_item()` - Remove with cache invalidation
  - `get_banlist_map()` - Optimized O(1) lookup structure
  - `health_check()` - Database connectivity

#### 3. Data Layer
- **Models** (SQLAlchemy)
  - `BanlistItem` - Core entity
- **Schemas** (Pydantic v2)
  - Request validation
  - Response serialization

#### 4. Core Infrastructure
- **Config**: Environment-based settings
- **Database**: Async SQLAlchemy with connection pooling
- **Cache**: Redis with TTL management
- **Security**: API key validation
- **Rate Limiting**: Sliding window algorithm with Redis
- **Exceptions**: Custom hierarchy for error handling

### Extension Architecture

#### Content Script (`content-script.ts`)
- Runs in FACEIT page context
- Observes DOM mutations for player names
- Detects players using configurable selectors
- Marks banned players with visual indicators
- Highlights player elements (reduced opacity)
- Adds clickable badges with tooltips

#### Background Service Worker (`service-worker.ts`)
- Periodic banlist refresh (60s interval)
- Cache management
- Message routing to/from content script
- Notification system
- Offline state handling

#### Popup UI (`popup.tsx`)
- React component with TypeScript
- Search/filter functionality
- Add/remove ban operations
- Banned player counter
- Responsive dark mode support
- Real-time list updates

#### Shared Utilities (`utils.ts`)
- API client functions
- Cache operations
- Format utilities
- Type definitions

### Data Flow

#### Add to Banlist Flow
```
Popup UI
   │
   ├─ GET_BANLIST → Background
   │                   │
   │                   ├─ Check cache
   │                   ├─ Fetch from API if needed
   │                   └─ Return cached/fresh data
   │
   ├─ User fills form
   ├─ POST /api/v1/ban
   │    │
   │    ├─ API validates API-Key
   │    ├─ Check rate limit
   │    ├─ Validate schema
   │    ├─ Check duplicate
   │    ├─ Insert to DB
   │    ├─ Invalidate cache
   │    └─ Return BanlistItem
   │
   └─ Update UI with new item
```

#### Detection Flow
```
Page Load
   │
   ├─ Content script initializes
   ├─ Background refreshes banlist
   ├─ Cache stored in chrome.storage.local
   │
   └─ DOM MutationObserver activated
        │
        ├─ Detects new player elements
        ├─ Extracts player names
        ├─ Checks against cached banlist (O(1))
        ├─ If banned:
        │   ├─ Reduce element opacity
        │   ├─ Add red badge
        │   └─ Add click handler for tooltip
        │
        └─ Updates existing players
```

## Performance Considerations

### Backend Optimization

1. **Async/Await**: All I/O operations are async
   - No thread blocking on database/network
   - Efficient handling of concurrent requests

2. **Connection Pooling**: SQLAlchemy NullPool
   - Each request gets dedicated connection
   - No connection limit overhead

3. **Redis Caching**:
   - Banlist cached for 1 hour
   - Cache invalidated on writes
   - Reduces database load by ~90%

4. **O(1) Lookup**:
   - Banlist stored as Map with lowercase keys
   - Instant player ban status check
   - No need for database queries

5. **Rate Limiting**:
   - Sliding window with Redis
   - Per-IP address tracking
   - Configurable limits (100/60s default)

6. **Database Indexes**:
   - Composite index on faceit_name
   - Case-insensitive lookups optimized

### Extension Optimization

1. **DOM Monitoring**:
   - Debounced MutationObserver (300ms)
   - Prevents excessive re-scanning
   - Efficient element selection

2. **Client-Side Caching**:
   - Local storage for offline support
   - 1-hour TTL matches backend cache
   - Automatic sync with background worker

3. **O(1) Player Lookup**:
   - JavaScript Map with lowercase keys
   - Instant banned status check
   - No API calls during detection

4. **Lazy Loading**:
   - Styles injected on demand
   - Scripts loaded asynchronously
   - Minimal memory footprint

## Security Architecture

### API Authentication
- X-API-Key header validation
- Keys stored in environment
- Configurable per-environment

### Input Validation
- Pydantic schemas validate all inputs
- FACEIT name: 2-32 chars, alphanumeric + - _
- Reason: 1-250 characters
- Author: 2-32 characters
- SQL injection prevention via ORM

### Rate Limiting
- Redis sliding window per IP
- Configurable requests/period
- Returns 429 on limit exceeded

### CORS
- Configurable allowed origins
- Prevents cross-origin abuse
- Cookie-based session support

### Extension
- Content Security Policy in manifest
- No inline scripts or eval()
- Secure DOM manipulation
- Safe JSON parsing

## Database Schema

### banlist_items table
```
id (UUID)           - Primary key
faceit_name (VARCHAR 32)   - Unique, indexed
reason (VARCHAR 250)       - Ban reason
author (VARCHAR 32)        - Ban author
created_at (TIMESTAMP)     - Creation time
updated_at (TIMESTAMP)     - Last update

Indexes:
- PRIMARY KEY (id)
- UNIQUE (faceit_name)
- INDEX (faceit_name_lower)
```

## Deployment Modes

### Development
```bash
docker-compose up
uvicorn api.app.main:app --reload
```

### Production
```bash
docker-compose -f docker-compose.yml \
  -f docker-compose.prod.yml up -d

# or Kubernetes, AWS ECS, etc.
```

## Monitoring & Observability

### Health Checks
- `/health` - Full system check
- Database connectivity
- Redis connectivity
- Returns 200 if all OK, 500 if degraded

### Logging
- Structured logging with Python logging
- Request/response logging
- Error tracking with stack traces

### Metrics (Future)
- Prometheus exposition format
- Request latency
- Cache hit/miss rates
- Database query times
- Rate limit hits

## Future Enhancements

1. **Authentication**: JWT tokens with expiration
2. **Audit Logging**: Track all ban changes
3. **Webhooks**: Real-time updates to clients
4. **Notifications**: Email/Discord alerts
5. **Analytics**: Ban statistics and trends
6. **API Versioning**: Multiple API versions
7. **GraphQL**: Alternative query interface
8. **WebSockets**: Real-time updates
9. **Database Replication**: High availability
10. **Geographic Distribution**: CDN caching
