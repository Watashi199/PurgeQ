# PurgeQ Deployment Guide

## Pre-Deployment Checklist

- [ ] All tests passing locally
- [ ] Code linting passes (Ruff, Black, ESLint)
- [ ] Type checking passes (mypy, TypeScript)
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] Docker images built and tested
- [ ] Security scanning completed
- [ ] Documentation updated

## Environment Setup

### 1. Create Production Environment File

```bash
cp .env.example .env.production
```

Configure for production:

```env
# Security
DEBUG=false
ALLOWED_ORIGINS=https://yourdomain.com

# Database
DATABASE_URL=postgresql+asyncpg://postgres:PASSWORD@db.example.com:5432/purgeq_prod
DB_ECHO=false

# Redis
REDIS_URL=redis://cache.example.com:6379/0

# API
VALID_API_KEYS=prod-key-1,prod-key-2
RATE_LIMIT_CALLS=1000
RATE_LIMIT_PERIOD=3600

# Logging
LOG_LEVEL=info
```

## Docker Deployment

### Build Production Image

```bash
docker build -f docker/Dockerfile.api \
  -t purgeq-api:1.0.0 \
  -t purgeq-api:latest .
```

### Push to Registry

```bash
# Login to registry
docker login ghcr.io

# Tag and push
docker tag purgeq-api:latest ghcr.io/yourusername/purgeq-api:latest
docker push ghcr.io/yourusername/purgeq-api:latest
```

### Docker Compose (Production)

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  api:
    image: ghcr.io/yourusername/purgeq-api:latest
    restart: always
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - DEBUG=false
      - LOG_LEVEL=info
    ports:
      - "8000:8000"
    depends_on:
      - postgres
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: postgres:16-alpine
    restart: always
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    environment:
      - POSTGRES_DB=purgeq
      - POSTGRES_PASSWORD=${DB_PASSWORD}

  redis:
    image: redis:7-alpine
    restart: always
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

volumes:
  postgres_data:
  redis_data:
```

Deploy:

```bash
docker-compose -f docker-compose.yml \
  -f docker-compose.prod.yml \
  up -d
```

## Kubernetes Deployment

### Prerequisites
- Kubernetes cluster (1.24+)
- `kubectl` configured
- Container registry access

### Create Namespace

```bash
kubectl create namespace purgeq
```

### Create Secrets

```bash
kubectl create secret generic purgeq-secrets \
  --from-literal=database-url="$DATABASE_URL" \
  --from-literal=redis-url="$REDIS_URL" \
  --from-literal=api-keys="$VALID_API_KEYS" \
  -n purgeq
```

### Deploy Manifests

Create `k8s/deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: purgeq-api
  namespace: purgeq
spec:
  replicas: 3
  selector:
    matchLabels:
      app: purgeq-api
  template:
    metadata:
      labels:
        app: purgeq-api
    spec:
      containers:
      - name: api
        image: ghcr.io/yourusername/purgeq-api:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: purgeq-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: purgeq-secrets
              key: redis-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: purgeq-api
  namespace: purgeq
spec:
  selector:
    app: purgeq-api
  ports:
  - port: 8000
    targetPort: 8000
  type: LoadBalancer
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: purgeq-api-hpa
  namespace: purgeq
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: purgeq-api
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

Deploy:

```bash
kubectl apply -f k8s/deployment.yaml
```

Monitor:

```bash
kubectl get pods -n purgeq
kubectl logs -f deployment/purgeq-api -n purgeq
```

## AWS ECS Deployment

### Create ECS Task Definition

```json
{
  "family": "purgeq-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "purgeq-api",
      "image": "ghcr.io/yourusername/purgeq-api:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "hostPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "DEBUG",
          "value": "false"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:purgeq/db-url"
        },
        {
          "name": "REDIS_URL",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:purgeq/redis-url"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/purgeq-api",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

Register and deploy:

```bash
aws ecs register-task-definition \
  --cli-input-json file://task-definition.json

aws ecs create-service \
  --cluster purgeq-prod \
  --service-name purgeq-api \
  --task-definition purgeq-api:1 \
  --desired-count 3
```

## Nginx Reverse Proxy

```nginx
upstream purgeq_api {
    least_conn;
    server 127.0.0.1:8000 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:8001 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:8002 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name api.example.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.example.com;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/api.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Compression
    gzip on;
    gzip_types text/plain text/css application/json;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
    limit_req zone=api burst=200 nodelay;

    # Proxy
    location / {
        proxy_pass http://purgeq_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://purgeq_api/health;
        access_log off;
    }
}
```

## Database Backup

### PostgreSQL Backup

```bash
# Full backup
pg_dump -U postgres -h localhost purgeq | gzip > backup_$(date +%Y%m%d).sql.gz

# From Docker
docker-compose exec postgres pg_dump -U postgres purgeq | gzip > backup_$(date +%Y%m%d).sql.gz

# Restore
gunzip -c backup_20240501.sql.gz | psql -U postgres purgeq
```

### Automated Backups (Cron)

```bash
# Add to crontab -e
0 2 * * * /usr/local/bin/backup-purgeq.sh
```

Create `/usr/local/bin/backup-purgeq.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/backups/purgeq"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

docker-compose -f /app/docker-compose.yml exec -T postgres \
  pg_dump -U postgres purgeq | \
  gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +7 -delete
```

## Monitoring & Logging

### Prometheus Metrics

Add to API:

```python
from prometheus_client import Counter, Histogram, generate_latest

request_count = Counter('purgeq_requests_total', 'Total requests', ['method', 'endpoint'])
request_latency = Histogram('purgeq_request_latency_seconds', 'Request latency')
```

### ELK Stack Setup

```bash
# Docker Compose stack
docker-compose -f elk-docker-compose.yml up -d

# Configure Filebeat to ship logs
filebeat -e -c filebeat.yml
```

### CloudWatch Logs (AWS)

Logs automatically sent from ECS tasks. View:

```bash
aws logs tail /ecs/purgeq-api --follow
```

## SSL/TLS Certificates

### Let's Encrypt with Certbot

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --nginx -d api.example.com

# Auto-renewal (already set up with apt)
sudo systemctl status certbot.timer
```

### Self-Signed (Development)

```bash
openssl req -x509 -newkey rsa:4096 \
  -keyout key.pem -out cert.pem -days 365 -nodes
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker logs purgeq-api

# Check port conflicts
netstat -tulpn | grep 8000

# Rebuild image
docker-compose build --no-cache api
```

### Database connection timeout

```bash
# Check connectivity
docker exec purgeq-postgres psql -U postgres -c "SELECT 1"

# Check firewall
ufw status
ufw allow 5432
```

### Performance issues

```bash
# Check CPU/Memory
docker stats

# Check database queries
docker exec purgeq-postgres psql -U postgres -d purgeq -c "SELECT * FROM pg_stat_statements LIMIT 10;"

# Check Redis memory
redis-cli INFO memory
```

### Cache not working

```bash
# Test Redis connection
redis-cli -h localhost ping

# Check cache contents
redis-cli -h localhost KEYS "banlist:*"

# Flush cache
redis-cli -h localhost FLUSHALL
```

## Post-Deployment

1. Verify health check: `curl https://api.example.com/health`
2. Test API endpoints with sample data
3. Monitor logs for errors
4. Set up alerting (PagerDuty, Slack, etc.)
5. Document deployment configuration
6. Plan disaster recovery procedures
7. Schedule regular backup verification
8. Review security policies

## Rollback Procedure

```bash
# Docker Compose
docker-compose down
docker-compose up -d  # with previous image tag

# Kubernetes
kubectl set image deployment/purgeq-api \
  purgeq-api=ghcr.io/yourusername/purgeq-api:previous-version

# AWS ECS
aws ecs update-service \
  --cluster purgeq-prod \
  --service purgeq-api \
  --task-definition purgeq-api:previous-version
```
