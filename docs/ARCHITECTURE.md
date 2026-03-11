# 🏗️ Architecture Guide

## System Overview

Tasmil Finance Incentive Program is a **Web3 quest platform** built with:
- **Backend**: NestJS + TypeScript
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **Authentication**: Wallet signature verification (ethers.js)
- **Deployment**: Docker + Docker Compose

---

## 🎯 **Core Features**

1. **Wallet Authentication** - Sign-in with Web3 wallet (no password)
2. **Campaign Management** - Admins create quests with tasks
3. **Task Submission** - Users submit proof of completion
4. **Reward System** - Point-based rewards with tier progression
5. **Referral System** - Earn points for inviting friends

---

## 🏛️ **Architecture Pattern**

### Layered Architecture

```
┌─────────────────────────────────────────┐
│         Controllers (HTTP Layer)         │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ │
│  │  Auth   │ │Campaigns │ │  Tasks   │ │
│  └─────────┘ └──────────┘ └──────────┘ │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│        Services (Business Logic)        │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ │
│  │  Users  │ │  Claims  │ │  Admin   │ │
│  └─────────┘ └──────────┘ └──────────┘ │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│      Repositories (Data Access)         │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ │
│  │TypeORM  │ │  Redis   │ │  Cache   │ │
│  └─────────┘ └──────────┘ └──────────┘ │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│         Databases & Storage             │
│    ┌─────────────┐  ┌────────────┐     │
│    │ PostgreSQL  │  │   Redis    │     │
│    └─────────────┘  └────────────┘     │
└─────────────────────────────────────────┘
```

---

## 📁 **Module Structure**

### Feature Modules

```typescript
src/modules/
├── auth/               # Authentication & JWT
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts
│   ├── dto/
│   └── interfaces/
│
├── users/              # User management
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── entities/
│   │   └── user.entity.ts
│   └── dto/
│
├── campaigns/          # Campaign CRUD
│   ├── campaigns.controller.ts
│   ├── campaigns.service.ts
│   ├── entities/
│   │   ├── campaign.entity.ts
│   │   └── campaign-participation.entity.ts
│   └── dto/
│
├── tasks/              # Task operations
│   ├── tasks.controller.ts
│   ├── tasks.service.ts
│   └── entities/
│       └── task.entity.ts
│
├── user-tasks/         # User task submissions
│   ├── user-tasks.service.ts
│   └── entities/
│       └── user-task.entity.ts
│
├── claims/             # Reward claiming
│   ├── claims.service.ts
│   └── entities/
│       ├── task-claim.entity.ts
│       ├── campaign-claim.entity.ts
│       └── referral-event.entity.ts
│
├── admin/              # Admin operations
│   ├── admin.controller.ts
│   └── admin.service.ts
│
├── analytics/          # Leaderboards & stats
│   ├── analytics.controller.ts
│   └── analytics.service.ts
│
└── notifications/      # User notifications
    ├── notifications.controller.ts
    └── notifications.service.ts
```

### Common Layer

```typescript
src/common/
├── decorators/         # Custom decorators
│   ├── current-user.decorator.ts
│   ├── public.decorator.ts
│   └── roles.decorator.ts
│
├── guards/            # Route guards
│   ├── jwt-auth.guard.ts
│   ├── roles.guard.ts
│   └── optional-jwt.guard.ts
│
├── filters/           # Exception handling
│   └── http-exception.filter.ts
│
├── interceptors/      # Response transformation
│   └── response.interceptor.ts
│
├── pipes/             # Input validation
│   └── parse-uuid.pipe.ts
│
├── enums/            # Type definitions
│   ├── user-role.enum.ts
│   ├── user-tier.enum.ts
│   ├── user-task-status.enum.ts
│   └── campaign-category.enum.ts
│
└── exceptions/       # Custom errors
    └── business.exception.ts
```

---

## 🗄️ **Database Schema**

### Entity Relationship Diagram

```mermaid
erDiagram
    users ||--o{ campaign_participation : "joins"
    users ||--o{ user_tasks : "submits"
    users ||--o{ task_claims : "claims"
    users ||--o{ campaign_claims : "claims"
    users ||--o{ referral_events : "refers"
    
    campaigns ||--o{ tasks : "contains"
    campaigns ||--o{ campaign_participation : "has"
    campaigns ||--o{ user_tasks : "part_of"
    campaigns ||--o{ campaign_claims : "rewarded_via"
    
    tasks ||--o{ user_tasks : "assigned_to"
    tasks ||--o{ task_claims : "rewarded_via"
    
    user_tasks ||--o{ referral_events : "triggers"

    users {
        uuid id PK
        string username UK
        string wallet_address UK
        string avatar_url
        enum tier
        int total_points
        int login_streak
        timestamp last_login_at
        string referral_code UK
        uuid referred_by FK
        enum role
    }
    
    campaigns {
        uuid id PK
        string title
        text description
        enum category
        int reward_points
        int min_tasks_to_complete
        int questers_count
        timestamp start_at
        timestamp end_at
    }
    
    tasks {
        uuid id PK
        uuid campaign_id FK
        string name
        text description
        text url_action
        int reward_points
        enum task_type
        int task_order UK
    }
    
    user_tasks {
        uuid id PK
        uuid user_id FK
        uuid campaign_id FK
        uuid task_id FK "UK(user_id,task_id)"
        enum status
        text proof_data
        timestamp completed_at
        int points_earned
    }
    
    task_claims {
        uuid id PK
        uuid user_id FK "UK(user_id,task_id)"
        uuid campaign_id FK
        uuid task_id FK
        int points_earned
        timestamp claimed_at
    }
    
    campaign_claims {
        uuid id PK
        uuid user_id FK "UK(user_id,campaign_id)"
        uuid campaign_id FK
        int points_earned
        timestamp claimed_at
    }
```

### Key Indexes

```sql
-- Users
CREATE INDEX idx_users_wallet_address ON users(wallet_address);
CREATE INDEX idx_users_total_points ON users(total_points);

-- Campaigns
CREATE INDEX idx_campaigns_category ON campaigns(category);

-- Tasks
CREATE UNIQUE INDEX idx_tasks_campaign_order ON tasks(campaign_id, task_order);

-- User Tasks
CREATE INDEX idx_user_tasks_user_id ON user_tasks(user_id);
CREATE INDEX idx_user_tasks_campaign_id ON user_tasks(campaign_id);
CREATE UNIQUE INDEX uq_user_task_user_task ON user_tasks(user_id, task_id);

-- Claims
CREATE UNIQUE INDEX uq_task_claim_user_task ON task_claims(user_id, task_id);
CREATE UNIQUE INDEX uq_campaign_claim_user_campaign ON campaign_claims(user_id, campaign_id);
```

---

## 🔐 **Security Architecture**

### Authentication Flow

```mermaid
graph LR
    A[User] -->|1. Request Nonce| B[Backend]
    B -->|2. Generate| C[Redis]
    C -->|3. Store TTL=5min| C
    B -->|4. Return nonce| A
    A -->|5. Sign with Wallet| A
    A -->|6. Send signature| B
    B -->|7. Verify| D[ethers.verifyMessage]
    B -->|8. Check nonce| C
    B -->|9. Generate JWT| E[JwtService]
    E -->|10. accessToken + refreshToken| A
```

### Authorization Layers

1. **Global JWT Guard** - All routes protected by default
2. **Public Decorator** - Opt-out for login/nonce endpoints  
3. **Roles Guard** - Admin-only routes (`@Roles(UserRole.Admin)`)
4. **Optional JWT Guard** - Public routes with user context

### Token Strategy

- **Access Token**: 15 minutes TTL, stored in memory
- **Refresh Token**: 7 days TTL, stored in Redis with revocation support
- **Rotation**: New tokens issued on refresh, old token revoked

---

## 💾 **Data Flow**

### Task Claim Flow (Critical Path)

```mermaid
sequenceDiagram
    participant User
    participant API
    participant TransactionManager
    participant UserTaskRepo
    participant TaskRepo
    participant ClaimRepo
    participant UserService
    participant Redis

    User->>API: POST /tasks/:id/claim
    API->>TransactionManager: BEGIN
    
    TransactionManager->>UserTaskRepo: SELECT FOR UPDATE
    Note over UserTaskRepo: Pessimistic Lock
    
    UserTaskRepo-->>TransactionManager: userTask (locked)
    
    alt status != approved
        TransactionManager-->>User: Error: TASK_NOT_APPROVED
    end
    
    TransactionManager->>TaskRepo: SELECT task
    TaskRepo-->>TransactionManager: task data
    
    TransactionManager->>ClaimRepo: INSERT claim
    
    alt Unique constraint violation
        TransactionManager-->>User: Error: ALREADY_CLAIMED
    end
    
    TransactionManager->>UserService: applyPointChange()
    UserService->>UserTaskRepo: UPDATE user.totalPoints
    UserService->>UserTaskRepo: UPDATE user.tier
    
    TransactionManager->>TransactionManager: COMMIT
    TransactionManager-->>User: Success: claim created
```

---

## 🚀 **Performance Optimizations**

### Caching Strategy

```typescript
// Campaign list cache (60s TTL)
const cacheKey = `campaigns:${JSON.stringify(query)}`;

// Single campaign cache (60s TTL, user-specific queries not cached)
const cacheKey = userId ? null : `campaign:${id}`;
```

### Database Optimizations

1. **Indexes** on frequently queried columns
2. **Pessimistic locking** for critical paths (claims)
3. **Batch operations** with `Promise.all()`
4. **Query builder** for complex queries

### Redis Usage

- **Nonce storage** (5 min TTL)
- **Refresh tokens** (7 days TTL)
- **Rate limiting** (rate-limiter-flexible)
- **Cache** (NestJS cache-manager)
- **Daily login tracking** (24h TTL)

---

## 🔄 **State Machines**

### UserTask Status Transitions

```mermaid
stateDiagram-v2
    [*] --> Pending: Task created
    Pending --> Submitted: User submits proof
    Submitted --> Approved: Admin approves
    Submitted --> Rejected: Admin rejects
    Approved --> [*]: User claims reward
    Rejected --> Submitted: User resubmits
```

### Campaign Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Draft: Created
    Draft --> Active: startAt reached
    Active --> Active: User joins/completes
    Active --> Ended: endAt reached
    Ended --> [*]
```

---

## 🛡️ **Error Handling**

### Exception Hierarchy

```typescript
HttpException (NestJS)
  └── BusinessException (Custom)
        ├── NONCE_EXPIRED
        ├── INVALID_SIGNATURE  
        ├── TASK_NOT_APPROVED
        ├── ALREADY_CLAIMED
        └── ...
```

### Global Exception Filter

```typescript
@Catch()
export class HttpExceptionFilter {
  // Transforms all errors to:
  {
    success: false,
    data: null,
    error: {
      code: "ERROR_CODE",
      message: "Human readable message"
    }
  }
}
```

---

## 📊 **Monitoring Points**

### Critical Metrics

1. **Authentication**
   - Nonce generation rate
   - Failed signature verifications
   - Token refresh failures

2. **Business Logic**
   - Task claim success/failure rate
   - Campaign claim rate
   - Average approval time

3. **Performance**
   - Cache hit/miss ratio
   - Database query duration
   - Redis latency

4. **Errors**
   - Unique constraint violations
   - Transaction rollbacks
   - Rate limit hits

---

## 🔧 **Configuration Management**

### Config Namespaces

```typescript
config/
├── app.config.ts       # PORT, API_PREFIX, ALLOWED_ORIGINS
├── database.config.ts  # DB connection settings
├── redis.config.ts     # Redis connection
└── auth.config.ts      # JWT secrets, TTLs
```

### Environment-Based Loading

```typescript
ConfigModule.forRoot({
  isGlobal: true,
  load: [appConfig, databaseConfig, redisConfig, authConfig],
});
```

---

## 🧪 **Testing Strategy**

### Unit Tests
- Services: Mock repositories & dependencies
- Guards: Test authorization logic
- Pipes: Validate transformation

### Integration Tests
- Controllers: Test HTTP layer with mocked services
- Database: Use in-memory SQLite or test database

### E2E Tests  
- Full flow: Login → Join → Submit → Claim
- Use test database with migrations

---

## 🔗 **External Dependencies**

| Package | Purpose |
|---------|---------|
| `ethers` | Wallet signature verification |
| `typeorm` | ORM & migrations |
| `@nestjs/jwt` | JWT token handling |
| `@nestjs/passport` | Authentication strategy |
| `ioredis` | Redis client |
| `rate-limiter-flexible` | Rate limiting |
| `cache-manager` | Caching abstraction |
| `helmet` | Security headers |
| `class-validator` | DTO validation |

---

## 📖 **Further Reading**

- [API Flow Guide](./API_FLOW.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
