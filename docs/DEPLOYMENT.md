# 🚀 Deployment Guide

Production deployment instructions for Tasmil Finance Incentive Program backend.

---

## 📋 **Pre-Deployment Checklist**

### 1. Security Review

- [ ] All security issues from [architecture_review.md](../../.gemini/antigravity/brain/799ff553-871b-4e4c-91da-f7954297fba6/architecture_review.md) fixed
- [ ] JWT secrets are **NOT using defaults**
- [ ] CORS configured with specific origins
- [ ] Rate limiting enabled
- [ ] Environment variables validated
- [ ] Database migrations reviewed
- [ ] No sensitive data in logs

### 2. Environment Setup

- [ ] Production `.env` file created
- [ ] Database backup configured
- [ ] Redis persistence enabled
- [ ] Monitoring tools ready
- [ ] SSL certificates prepared
- [ ] Domain/subdomain configured

### 3. Code Quality

- [ ] All tests passing (`npm run test`)
- [ ] TypeScript compilation clean (`npm run build`)
- [ ] No console.log/console.error in production code
- [ ] Error handling verified
- [ ] Dependencies audited (`npm audit`)

---

## 🔧 **Environment Configuration**

### Production `.env` Template

```bash
# Node Environment
NODE_ENV=production
PORT=3000
API_PREFIX=api

# CORS - CRITICAL: Set your actual frontend domain
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# PostgreSQL
DB_TYPE=postgres
DB_HOST=your-db-host.example.com  # RDS, Cloud SQL, etc.
DB_PORT=5432
DB_NAME=tasmil_prod
DB_USERNAME=tasmil_user
DB_PASSWORD=STRONG_PASSWORD_HERE  # Use secrets manager
DB_LOGGING=false

# Redis
REDIS_HOST=your-redis-host.example.com
REDIS_PORT=6379
REDIS_PASSWORD=STRONG_REDIS_PASSWORD
REDIS_DB=0
REDIS_DEFAULT_TTL=300
MOCK_REDIS=false  # CRITICAL: Must be false in production

# JWT - CRITICAL: Generate strong secrets
JWT_ACCESS_SECRET=YOUR_256_BIT_RANDOM_SECRET_HERE
JWT_REFRESH_SECRET=YOUR_DIFFERENT_256_BIT_SECRET_HERE
JWT_ACCESS_TTL=900        # 15 minutes
JWT_REFRESH_TTL=604800    # 7 days

# Features
REFERRAL_REWARD_POINTS=100
```

### Generate Strong Secrets

```bash
# Generate JWT secrets (run twice for two different secrets)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 🐳 **Docker Deployment**

### Option 1: Docker Compose (Recommended for single server)

#### 1.1 Update `docker-compose.yml` for Production

```yaml
version: '3.9'

services:
  api:
    build: .
    env_file:
      - .env.production  # Use production env file
    command: npm run start:prod
    ports:
      - '3000:3000'
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: always  # Auto-restart on failure
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - app-net

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${DB_USERNAME}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    ports:
      - '5432:5432'
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./backups:/backups  # Backup directory
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USERNAME}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: always
    networks:
      - app-net

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD} --appendonly yes
    ports:
      - '6379:6379'
    volumes:
      - redis-data:/data
    restart: always
    networks:
      - app-net

networks:
  app-net:
    driver: bridge

volumes:
  postgres-data:
  redis-data:
```

#### 1.2 Deploy Commands

```bash
# Build and start
docker-compose -f docker-compose.yml up --build -d

# Run migrations
docker exec -it backend-api-1 npm run typeorm:migration:run

# Check logs
docker logs -f backend-api-1

# Check health
curl http://your-server:3000/api/health
```

---

### Option 2: Docker Swarm (Multi-server)

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml tasmil

# Scale services
docker service scale tasmil_api=3

# Check status
docker service ls
docker service logs tasmil_api
```

---

### Option 3: Kubernetes

#### 3.1 Create Namespace

```bash
kubectl create namespace tasmil-prod
```

#### 3.2 Deploy Secrets

```bash
# Create secret from .env file
kubectl create secret generic tasmil-secrets \
  --from-env-file=.env.production \
  -n tasmil-prod
```

#### 3.3 Deploy Manifests

See `k8s/` directory for complete manifests:
- `deployment.yaml` - API deployment
- `service.yaml` - Load balancer
- `ingress.yaml` - HTTPS routing
- `postgres.yaml` - Database stateful set
- `redis.yaml` - Cache deployment

```bash
kubectl apply -f k8s/ -n tasmil-prod
```

---

## ☁️ **Cloud Platform Deployments**

### AWS Deployment

#### Architecture

```
Internet → ALB → ECS Fargate (API) → RDS PostgreSQL
                              ↓
                        ElastiCache Redis
```

#### Setup Steps

1. **Create RDS PostgreSQL Instance**
   ```bash
   aws rds create-db-instance \
     --db-instance-identifier tasmil-prod-db \
     --db-instance-class db.t3.micro \
     --engine postgres \
     --engine-version 16 \
     --master-username admin \
     --master-user-password YOUR_PASSWORD \
     --allocated-storage 20
   ```

2. **Create ElastiCache Redis**
   ```bash
   aws elasticache create-cache-cluster \
     --cache-cluster-id tasmil-redis \
     --engine redis \
     --cache-node-type cache.t3.micro \
     --num-cache-nodes 1
   ```

3. **Build & Push Docker Image**
   ```bash
   aws ecr create-repository --repository-name tasmil-api
   
   docker build -t tasmil-api .
   docker tag tasmil-api:latest YOUR_AWS_ID.dkr.ecr.REGION.amazonaws.com/tasmil-api:latest
   
   aws ecr get-login-password --region REGION | docker login --username AWS --password-stdin YOUR_AWS_ID.dkr.ecr.REGION.amazonaws.com
   
   docker push YOUR_AWS_ID.dkr.ecr.REGION.amazonaws.com/tasmil-api:latest
   ```

4. **Create ECS Task Definition**
   - Use AWS Console or CloudFormation
   - Set environment variables from Secrets Manager
   - Configure health checks

5. **Create ECS Service**
   - Attach to ALB
   - Enable auto-scaling
   - Set desired count: 2

---

### Google Cloud Platform

```bash
# Build image
gcloud builds submit --tag gcr.io/PROJECT_ID/tasmil-api

# Deploy to Cloud Run
gcloud run deploy tasmil-api \
  --image gcr.io/PROJECT_ID/tasmil-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production" \
  --set-secrets="JWT_ACCESS_SECRET=jwt-secret:latest" \
  --min-instances=1 \
  --max-instances=10
```

---

### Heroku

```bash
# Login
heroku login

# Create app
heroku create tasmil-api

# Add PostgreSQL & Redis
heroku addons:create heroku-postgresql:mini
heroku addons:create heroku-redis:mini

# Set config vars
heroku config:set NODE_ENV=production
heroku config:set JWT_ACCESS_SECRET=xxx
heroku config:set ALLOWED_ORIGINS=https://yourdomain.com

# Deploy
git push heroku main

# Run migrations
heroku run npm run typeorm:migration:run
```

---

## 🔒 **SSL & Reverse Proxy Setup**

### Nginx as Reverse Proxy

```nginx
# /etc/nginx/sites-available/tasmil-api
server {
    listen 80;
    server_name api.yourdomain.com;
    
    # Redirect to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    # SSL certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Proxy to API
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable & Reload:
```bash
sudo ln -s /etc/nginx/sites-available/tasmil-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 📊 **Monitoring & Logging**

### Application Monitoring

#### Install PM2 (for non-Docker deployments)

```bash
npm install -g pm2

# Start app
pm2 start dist/main.js --name tasmil-api

# Monitor
pm2 monit

# Logs
pm2 logs tasmil-api

# Auto-restart on server reboot
pm2 startup
pm2 save
```

#### Health Check Endpoint

Add to `app.controller.ts`:
```typescript
@Get('health')
healthCheck() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
}
```

### Logging Solutions

- **CloudWatch Logs** (AWS)
- **Stackdriver** (GCP)
- **Datadog**
- **New Relic**
- **Sentry** (Error tracking)

---

## 🔄 **Database Migrations**

### Pre-Deployment

```bash
# Review pending migrations
npm run typeorm:migration:show

# Test migrations on staging
npm run typeorm:migration:run

# If issues, revert
npm run typeorm:migration:revert
```

### Zero-Downtime Migrations

1. **Additive changes first** (new columns, tables)
2. **Deploy new code**
3. **Remove old columns** in next deployment

---

## 🔐 **Secrets Management**

### AWS Secrets Manager

```bash
# Store secrets
aws secretsmanager create-secret \
  --name tasmil/prod/jwt-access-secret \
  --secret-string "your-secret-here"

# Retrieve in app
import { SecretsManager } from '@aws-sdk/client-secrets-manager';
```

### HashiCorp Vault

```bash
vault kv put secret/tasmil/prod jwt_access_secret=xxx
```

---

## 📦 **Backup Strategy**

### Database Backups

```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="tasmil_backup_$DATE.sql"

docker exec backend-postgres-1 pg_dump -U postgres tasmil > "$BACKUP_DIR/$FILENAME"

# Compress
gzip "$BACKUP_DIR/$FILENAME"

# Upload to S3
aws s3 cp "$BACKUP_DIR/$FILENAME.gz" s3://your-backup-bucket/

# Delete local backups older than 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
```

Add to crontab:
```bash
0 2 * * * /path/to/backup.sh
```

---

## 🚦 **Deployment Checklist**

### Before Deployment

- [ ] Run tests: `npm run test`
- [ ] Build check: `npm run build`
- [ ] Security audit: `npm audit --production`
- [ ] Backup database
- [ ] Review migration scripts
- [ ] Update CHANGELOG.md

### During Deployment

- [ ] Enable maintenance mode (optional)
- [ ] Stop old containers/processes
- [ ] Pull latest code/images
- [ ] Run migrations
- [ ] Start new containers/processes
- [ ] Verify health check
- [ ] Test critical flows

### After Deployment

- [ ] Monitor error logs for 30 minutes
- [ ] Check metrics (response time, error rate)
- [ ] Test admin operations
- [ ] Test user flows
- [ ] Disable maintenance mode
- [ ] Notify team

---

## 🔼 **Rolling Updates**

### Docker Swarm

```bash
docker service update --image tasmil-api:latest tasmil_api
```

### Kubernetes

```bash
kubectl set image deployment/tasmil-api api=tasmil-api:v2.0.0 -n tasmil-prod
kubectl rollout status deployment/tasmil-api -n tasmil-prod
```

### Rollback

```bash
# Docker Swarm
docker service rollback tasmil_api

# Kubernetes
kubectl rollout undo deployment/tasmil-api -n tasmil-prod
```

---

## 📈 **Scaling**

### Horizontal Scaling

```bash
# Docker Swarm
docker service scale tasmil_api=5

# Kubernetes
kubectl scale deployment tasmil-api --replicas=5 -n tasmil-prod
```

### Auto-Scaling (Kubernetes)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: tasmil-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: tasmil-api
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

---

## 🆘 **Disaster Recovery**

### Restore from Backup

```bash
# Extract backup
gunzip tasmil_backup_20251207.sql.gz

# Restore
docker exec -i backend-postgres-1 psql -U postgres tasmil < tasmil_backup_20251207.sql
```

### Emergency Rollback

1. Revert to previous Docker image
2. Revert database migration
3. Clear Redis cache
4. Restart services

---

## 📚 **Related Documentation**

- [Architecture](./ARCHITECTURE.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
- [API Documentation](./API_DOCS.md)
