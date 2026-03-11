# 🔧 Troubleshooting Guide

Common issues and solutions for Tasmil Finance Incentive Program backend.

---

## 🚨 **Critical Issues**

### 1. Database Migration Errors

#### ❌ Error: "relation 'users' does not exist"

**Cause:** Database schema not initialized.

**Solution:**
```bash
# Check if migrations have run
docker exec -it backend-api-1 npm run typeorm:migration:show

# Run migrations
docker exec -it backend-api-1 npm run typeorm:migration:run

# Verify tables exist
docker exec -it backend-postgres-1 psql -U postgres -d tasmil -c "\dt"
```

---

#### ❌ Error: "duplicate key value violates unique constraint"

**Cause:** Migration already partially executed or data conflicts.

**Solution:**
```bash
# Check migration status
npm run typeorm:migration:show

# If partially run, revert last migration
npm run typeorm:migration:revert

# Re-run migration
npm run typeorm:migration:run

# If data conflict, investigate:
docker exec -it backend-postgres-1 psql -U postgres -d tasmil -c \
  "SELECT * FROM migrations ORDER BY timestamp DESC LIMIT 5;"
```

---

#### ❌ Error: "QueryFailedError: column does not exist"

**Cause:** Code expects column that hasn't been migrated yet.

**Solution:**
```bash
# 1. Check entity vs database schema
docker exec -it backend-postgres-1 psql -U postgres -d tasmil -c "\d users"

# 2. Generate new migration if entity changed
npm run typeorm:migration:generate -- -n AddMissingColumn

# 3. Run migration
npm run typeorm:migration:run
```

---

### 2. Authentication Issues

#### ❌ Error: "NONCE_EXPIRED"

**Cause:** Nonce used after 5 minutes or already consumed.

**Solution:**
```bash
# User flow:
# 1. Get new nonce
GET /api/auth/wallet/nonce?walletAddress=0x...

# 2. Sign immediately (within 5 minutes)
# 3. Login with fresh signature
POST /api/auth/wallet/login
```

**Debug:**
```bash
# Check Redis nonce store
docker exec -it backend-redis-1 redis-cli
> KEYS nonce:*
> TTL nonce:0x...
> GET nonce:0x...
```

---

#### ❌ Error: "INVALID_SIGNATURE"

**Cause:** 
- Incorrect signature
- Wallet address mismatch
- Nonce mismatch
- Message format wrong

**Solution:**
```typescript
// Frontend must sign EXACT message format:
const message = `Tasmil Login Nonce: ${nonce}`;
const signature = await signer.signMessage(message);
```

**Debug:**
```bash
# Check backend logs for verification details
docker logs backend-api-1 | grep "Signature verification"
```

---

#### ❌ Error: "INVALID_REFRESH_TOKEN"

**Cause:** Refresh token expired, revoked, or invalid.

**Solution:**
```bash
# Check Redis for token
docker exec -it backend-redis-1 redis-cli
> KEYS refresh_token:*
> TTL refresh_token:USER_ID:TOKEN_ID

# If expired, user must re-login
# If logout was called, token is revoked
```

---

### 3. Permission Errors

#### ❌ Error: 403 Forbidden

**Cause:** User doesn't have required role.

**Solution:**
```bash
# Check user role
docker exec -it backend-postgres-1 psql -U postgres -d tasmil -c \
  "SELECT id, username, role FROM users WHERE wallet_address='0x...';"

# Promote to admin (if needed)
docker exec -it backend-postgres-1 psql -U postgres -d tasmil -c \
  "UPDATE users SET role='admin' WHERE id='USER_UUID';"
```

---

### 4. Transaction & Lock Errors

#### ❌ Error: "FOR UPDATE cannot be applied to the nullable side of an outer join"

**Cause:** Using pessimistic lock with `relations` that creates LEFT OUTER JOIN.

**Solution:** Already fixed in `claims.service.ts`. If you encounter this:

```typescript
// ❌ BAD
const userTask = await repo.findOne({
  where: { userId, taskId },
  lock: { mode: 'pessimistic_write' },
  relations: ['task']  // Creates outer join
});

// ✅ GOOD
const userTask = await repo.findOne({
  where: { userId, taskId },
  lock: { mode: 'pessimistic_write' }
});
const task = await repo.findOne({ where: { id: taskId } });
```

---

#### ❌ Error: "deadlock detected"

**Cause:** Multiple transactions waiting on each other.

**Solution:**
```typescript
// Always lock resources in consistent order
// Example: Always lock user before task

// Set transaction timeout
await queryRunner.query('SET LOCAL lock_timeout = 5000'); // 5 seconds
```

**Investigate:**
```sql
-- Check active locks
SELECT * FROM pg_locks WHERE NOT granted;

-- Check blocked transactions
SELECT 
  blocked_locks.pid AS blocked_pid,
  blocked_activity.usename AS blocked_user,
  blocking_locks.pid AS blocking_pid,
  blocking_activity.usename AS blocking_user
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;
```

---

## 🐳 **Docker Issues**

### 5. Container Won't Start

#### ❌ Error: "Port already in use"

**Solution:**
```bash
# Find process using port 3000
lsof -i :3000
# or
netstat -anp | grep 3000

# Kill process
kill -9 PID

# Or change port in .env
PORT=3001
```

---

#### ❌ Error: "Container exited with code 1"

**Solution:**
```bash
# Check logs
docker logs backend-api-1

# Common causes:
# 1. Missing environment variables
# 2. Database connection failed
# 3. TypeScript compilation error

# Rebuild from scratch
docker-compose down -v  # ⚠️ Deletes volumes!
docker-compose up --build
```

---

#### ❌ Error: "Cannot connect to database"

**Solution:**
```bash
# Check if postgres container is running
docker ps | grep postgres

# Check postgres logs
docker logs backend-postgres-1

# Test connection manually
docker exec -it backend-postgres-1 psql -U postgres -d tasmil -c "SELECT 1;"

# Check network
docker network inspect backend_app-net

# Ensure API waits for postgres health check (already configured in docker-compose.yml)
```

---

### 6. Redis Connection Issues

#### ❌ Error: "Redis connection refused"

**Solution:**
```bash
# Check Redis container
docker ps | grep redis
docker logs backend-redis-1

# Test connection
docker exec -it backend-redis-1 redis-cli ping
# Should return: PONG

# If using password
docker exec -it backend-redis-1 redis-cli -a YOUR_PASSWORD ping
```

---

#### ❌ Error: "NOAUTH Authentication required"

**Solution:**
```bash
# Set REDIS_PASSWORD in .env
REDIS_PASSWORD=your-redis-password

# Update docker-compose.yml redis command:
command: redis-server --requirepass ${REDIS_PASSWORD}

# Update app config to use password
```

---

## 📦 **Build & Deployment Issues**

### 7. TypeScript Compilation Errors

#### ❌ Error: "Cannot find module '@nestjs/...'"

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# If in Docker, rebuild
docker-compose build --no-cache
```

---

#### ❌ Error: "Nest can't resolve dependencies"

**Cause:** Circular dependency or missing provider.

**Solution:**
```typescript
// Use forwardRef() for circular dependencies
@Module({
  imports: [forwardRef(() => OtherModule)]
})

// Check provider is in module's providers array
@Module({
  providers: [YourService],
  exports: [YourService]  // If used in other modules
})
```

---

### 8. Performance Issues

#### ❌ Slow API Response

**Diagnosis:**
```bash
# Check database query performance
docker exec -it backend-postgres-1 psql -U postgres -d tasmil

# Enable query logging
ALTER DATABASE tasmil SET log_statement = 'all';
ALTER DATABASE tasmil SET log_duration = on;

# Check slow queries in logs
docker logs backend-postgres-1 | grep "duration"
```

**Solutions:**
```sql
# Add missing indexes
CREATE INDEX idx_user_tasks_user_id ON user_tasks(user_id);
CREATE INDEX idx_user_tasks_status ON user_tasks(status);

# Analyze query plan
EXPLAIN ANALYZE SELECT * FROM user_tasks WHERE user_id = 'uuid';
```

---

#### ❌ High Memory Usage

**Solution:**
```bash
# Check container stats
docker stats

# Limit memory in docker-compose.yml
services:
  api:
    deploy:
      resources:
        limits:
          memory: 512M

# Check for memory leaks
# - Ensure no circular references in code
# - Use heap snapshot (Chrome DevTools)
```

---

## 🔐 **Security Issues**

### 9. CORS Errors

#### ❌ Error: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Solution:**
```typescript
// In main.ts, set allowed origins
app.enableCors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001'],
  credentials: true
});

// In .env
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

---

#### ❌ Error: "Preflight request failed"

**Solution:**
```typescript
// Ensure OPTIONS method is allowed
app.enableCors({
  origin: [ALLOWED_ORIGINS],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
});
```

---

### 10. Rate Limiting

#### ❌ Error: 429 Too Many Requests

**Cause:** User exceeded rate limit.

**Solution:**
```bash
# Check Redis for rate limit keys
docker exec -it backend-redis-1 redis-cli
> KEYS rlflx:*
> TTL rlflx:LOGIN:0x...

# Increase limits in auth.service.ts (if legitimate traffic)
const rateLimitConfig = {
  points: 10,  // Increase from 5
  duration: 60
};

# Or clear specific rate limit
> DEL rlflx:LOGIN:IP_ADDRESS
```

---

## 🧪 **Testing Issues**

### 11. E2E Tests Failing

#### ❌ Error: "Cannot connect to test database"

**Solution:**
```bash
# Ensure test database exists
docker exec -it backend-postgres-1 psql -U postgres -c "CREATE DATABASE tasmil_test;"

# Update test configuration
# test/jest-e2e.json
```

---

#### ❌ Error: "Test timeout"

**Solution:**
```typescript
// Increase timeout in test
it('should claim task', async () => {
  // ...
}, 10000); // 10 seconds

// Or globally in jest config
// jest-e2e.json
{
  "testTimeout": 30000
}
```

---

## 📊 **Data Issues**

### 12. Duplicate Key Violations

#### ❌ Error: "duplicate key value violates unique constraint 'idx_tasks_campaign_order'"

**Cause:** Trying to create task with same order number in campaign.

**Solution:**
```bash
# Check existing task orders
docker exec -it backend-postgres-1 psql -U postgres -d tasmil -c \
  "SELECT id, name, task_order FROM tasks WHERE campaign_id='CAMPAIGN_UUID' ORDER BY task_order;"

# Use next available order number
# Or update existing task order first
```

---

#### ❌ Error: "duplicate key value violates unique constraint 'uq_task_claim_user_task'"

**Cause:** User already claimed this task.

**Solution:**
```bash
# Check existing claim
docker exec -it backend-postgres-1 psql -U postgres -d tasmil -c \
  "SELECT * FROM task_claims WHERE user_id='USER_UUID' AND task_id='TASK_UUID';"

# This is expected behavior - return appropriate error to user
```

---

### 13. Data Inconsistencies

#### ❌ User points don't match sum of claims

**Diagnosis:**
```sql
-- Check user's total points
SELECT id, username, total_points FROM users WHERE id='USER_UUID';

-- Sum all claims
SELECT 
  SUM(points_earned) as total_from_task_claims
FROM task_claims 
WHERE user_id='USER_UUID';

SELECT 
  SUM(points_earned) as total_from_campaign_claims
FROM campaign_claims 
WHERE user_id='USER_UUID';

-- Check referral rewards
SELECT SUM(points) FROM referral_events WHERE referred_by_user_id='USER_UUID';
```

**Fix:**
```sql
-- Recalculate total points
UPDATE users SET total_points = (
  COALESCE((SELECT SUM(points_earned) FROM task_claims WHERE user_id = users.id), 0) +
  COALESCE((SELECT SUM(points_earned) FROM campaign_claims WHERE user_id = users.id), 0) +
  COALESCE((SELECT SUM(points) FROM referral_events WHERE referred_by_user_id = users.id), 0)
)
WHERE id = 'USER_UUID';
```

---

## 🔍 **Debugging Tips**

### Enable Debug Logging

```typescript
// In main.ts or specific service
import { Logger } from '@nestjs/common';

const logger = new Logger('ServiceName');
logger.debug('Debug info', { data });
logger.error('Error occurred', error.stack);
```

### Database Query Logging

```typescript
// In data-source.ts
export const AppDataSource = new DataSource({
  // ...
  logging: process.env.DB_LOGGING === 'true',
  logger: 'advanced-console'
});
```

### Redis Monitoring

```bash
# Monitor all Redis commands in real-time
docker exec -it backend-redis-1 redis-cli MONITOR

# Get Redis info
docker exec -it backend-redis-1 redis-cli INFO

# Check memory usage
docker exec -it backend-redis-1 redis-cli INFO memory
```

---

## 🆘 **Emergency Procedures**

### Clear All Cache

```bash
docker exec -it backend-redis-1 redis-cli FLUSHDB
```

### Reset Database (⚠️ Development Only)

```bash
# Backup first!
docker exec backend-postgres-1 pg_dump -U postgres tasmil > backup.sql

# Drop and recreate
docker exec -it backend-postgres-1 psql -U postgres -c "DROP DATABASE tasmil;"
docker exec -it backend-postgres-1 psql -U postgres -c "CREATE DATABASE tasmil;"

# Run migrations
docker exec -it backend-api-1 npm run typeorm:migration:run
```

### Restart All Services

```bash
docker-compose restart

# Or full rebuild
docker-compose down
docker-compose up --build -d
```

---

## 📞 **Getting Help**

### Collect Debug Info

```bash
#!/bin/bash
# Save this as debug-info.sh

echo "=== Docker Status ===" > debug-output.txt
docker ps -a >> debug-output.txt

echo "\n=== API Logs ===" >> debug-output.txt
docker logs --tail=100 backend-api-1 >> debug-output.txt

echo "\n=== Postgres Logs ===" >> debug-output.txt
docker logs --tail=50 backend-postgres-1 >> debug-output.txt

echo "\n=== Redis Logs ===" >> debug-output.txt
docker logs --tail=50 backend-redis-1 >> debug-output.txt

echo "\n=== Database Tables ===" >> debug-output.txt
docker exec backend-postgres-1 psql -U postgres -d tasmil -c "\dt" >> debug-output.txt

echo "\n=== Environment ===" >> debug-output.txt
cat .env | grep -v SECRET | grep -v PASSWORD >> debug-output.txt

echo "Debug info saved to debug-output.txt"
```

---

## 📚 **Related Documentation**

- [Architecture Guide](./ARCHITECTURE.md)
- [API Documentation](./API_DOCS.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Main README](../README.md)
