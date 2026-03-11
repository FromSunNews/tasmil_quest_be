# 📱 Complete Application Flow - Tasmil Incentive Platform

---

## 🔐 **AUTHENTICATION FLOW**

### 1️⃣ User Login (Wallet-Based)

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Redis
    participant Database

    User->>Frontend: Connect Wallet
    Frontend->>Backend: GET /api/auth/wallet/nonce?walletAddress=0x...
    Backend->>Redis: Generate & Store Nonce (TTL: 5 min)
    Backend-->>Frontend: { nonce, expiresIn: 300 }
    
    Frontend->>User: Request Signature
    User->>Frontend: Sign Message "Tasmil Login Nonce: {nonce}"
    
    Frontend->>Backend: POST /api/auth/wallet/login<br/>{ walletAddress, signature, referralCode? }
    Backend->>Backend: Verify Signature
    Backend->>Redis: Validate & Delete Nonce
    Backend->>Database: Find or Create User
    Backend->>Database: Update Login Streak
    Backend->>Redis: Store Refresh Token ID
    Backend-->>Frontend: { accessToken, refreshToken, user }
    
    Frontend->>Frontend: Store Tokens in localStorage
    Frontend->>Frontend: Add Authorization: Bearer {accessToken}
```

**API Endpoints:**

#### **GET** `/api/auth/wallet/nonce`
```bash
# Request
GET /api/auth/wallet/nonce?walletAddress=0x8f5e3af89316003a21cf6215480ff1dfb6d2e959

# Response
{
  "success": true,
  "data": {
    "walletAddress": "0x8f5e3af89316003a21cf6215480ff1dfb6d2e959",
    "nonce": "a3f5c8e1b2d4f6a8...", 
    "expiresIn": 300
  },
  "error": null
}
```

#### **POST** `/api/auth/wallet/login`
```bash
# Request
POST /api/auth/wallet/login
Content-Type: application/json

{
  "walletAddress": "0x8f5e3af89316003a21cf6215480ff1dfb6d2e959",
  "signature": "0x4f8a2b3c...",
  "referralCode": "abc123" // Optional
}

# Response
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "username": "user_2e959",
      "walletAddress": "0x8f5e3af89316003a21cf6215480ff1dfb6d2e959",
      "tier": "Bronze",
      "totalPoints": 0,
      "role": "user"
    }
  },
  "error": null
}
```

---

### 2️⃣ Refresh Access Token

```mermaid
sequenceDiagram
    participant Frontend
    participant Backend
    participant Redis

    Frontend->>Backend: POST /api/auth/refresh<br/>{ refreshToken }
    Backend->>Backend: Verify Refresh Token
    Backend->>Redis: Check Token ID Exists
    Redis-->>Backend: Token Valid ✅
    Backend->>Redis: Delete Old Token ID
    Backend->>Backend: Generate New Tokens
    Backend->>Redis: Store New Refresh Token ID
    Backend-->>Frontend: { accessToken, refreshToken, user }
```

#### **POST** `/api/auth/refresh`
```bash
# Request
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}

# Response
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...", // New
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...", // New
    "user": { ... }
  },
  "error": null
}
```

---

### 3️⃣ Logout

```mermaid
sequenceDiagram
    participant Frontend
    participant Backend
    participant Redis

    Frontend->>Backend: POST /api/auth/logout<br/>{ refreshToken }
    Backend->>Backend: Verify Refresh Token
    Backend->>Redis: Delete Token ID (Revoke)
    Backend-->>Frontend: { message: "Logged out" }
    Frontend->>Frontend: Clear localStorage
```

#### **POST** `/api/auth/logout`
```bash
# Request
POST /api/auth/logout
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}

# Response
{
  "success": true,
  "data": {
    "message": "Logged out"
  },
  "error": null
}
```

---

## 👨‍💼 **ADMIN FLOW**

### 4️⃣ Create Campaign

```mermaid
sequenceDiagram
    participant Admin
    participant Backend
    participant Database
    participant Cache

    Admin->>Backend: POST /api/admin/campaigns<br/>Authorization: Bearer {accessToken}
    Backend->>Backend: Verify JWT + Check Role = Admin
    Backend->>Database: INSERT INTO campaigns
    Backend->>Cache: Invalidate Campaign Cache
    Backend-->>Admin: { campaign }
```

#### **POST** `/api/admin/campaigns`
```bash
# Request
POST /api/admin/campaigns
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "title": "DeFi Dashboard Quest",
  "description": "Complete tasks to earn rewards",
  "category": "DeFi",
  "rewardPoints": 500,
  "minTasksToComplete": 3,
  "startAt": "2025-12-07T00:00:00.000Z",
  "endAt": "2025-12-31T23:59:59.000Z"
}

# Response
{
  "success": true,
  "data": {
    "id": "6f52e91b-b538-4af2-b11d-faffc12a3084",
    "title": "DeFi Dashboard Quest",
    "category": "DeFi",
    "rewardPoints": 500,
    "minTasksToComplete": 3,
    "questersCount": 0,
    "startAt": "2025-12-07T00:00:00.000Z",
    "endAt": "2025-12-31T23:59:59.000Z",
    "createdAt": "2025-12-07T02:00:00.000Z"
  },
  "error": null
}
```

---

### 5️⃣ Create Tasks for Campaign

```mermaid
sequenceDiagram
    participant Admin
    participant Backend
    participant Database

    Admin->>Backend: POST /api/admin/campaigns/{campaignId}/tasks
    Backend->>Backend: Verify Admin Role
    Backend->>Database: INSERT INTO tasks
    Backend-->>Admin: { task }
```

#### **POST** `/api/admin/campaigns/:campaignId/tasks`
```bash
# Request
POST /api/admin/campaigns/6f52e91b-b538-4af2-b11d-faffc12a3084/tasks
Authorization: Bearer {adminToken}
Content-Type: application/json

{
  "name": "Follow X Account",
  "description": "Follow @TasmilFinance on X",
  "urlAction": "https://x.com/TasmilFinance",
  "rewardPoints": 100,
  "taskType": "X",
  "taskOrder": 1
}

# Response
{
  "success": true,
  "data": {
    "id": "9c856f30-7e61-41f8-99cf-e993f528ce45",
    "campaignId": "6f52e91b-b538-4af2-b11d-faffc12a3084",
    "name": "Follow X Account",
    "rewardPoints": 100,
    "taskType": "X",
    "taskOrder": 1,
    "createdAt": "2025-12-07T02:05:00.000Z"
  },
  "error": null
}
```

---

## 👤 **USER CAMPAIGN PARTICIPATION FLOW**

### 6️⃣ Browse & View Campaigns

```mermaid
sequenceDiagram
    participant User
    participant Backend
    participant Cache
    participant Database

    User->>Backend: GET /api/campaigns?active=true&category=DeFi
    Backend->>Cache: Check Cache
    alt Cache Hit
        Cache-->>Backend: Return Cached Data
    else Cache Miss
        Backend->>Database: Query Campaigns
        Backend->>Cache: Store Result (TTL: 60s)
    end
    Backend-->>User: { items: [...], meta: {...} }
```

#### **GET** `/api/campaigns`
```bash
# Request
GET /api/campaigns?active=true&category=DeFi&page=1&limit=20

# Response
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "6f52e91b-b538-4af2-b11d-faffc12a3084",
        "title": "DeFi Dashboard Quest",
        "category": "DeFi",
        "rewardPoints": 500,
        "minTasksToComplete": 3,
        "questersCount": 42,
        "startAt": "2025-12-07T00:00:00.000Z",
        "endAt": "2025-12-31T23:59:59.000Z"
      }
    ],
    "meta": {
      "total": 1,
      "page": 1,
      "limit": 20
    }
  },
  "error": null
}
```

---

### 7️⃣ Join Campaign

```mermaid
sequenceDiagram
    participant User
    participant Backend
    participant Database

    User->>Backend: POST /api/campaigns/{id}/join<br/>Authorization: Bearer {accessToken}
    Backend->>Database: BEGIN Transaction
    Backend->>Database: Lock Campaign Row (FOR UPDATE)
    Backend->>Database: Check Already Joined?
    alt Already Joined
        Backend-->>User: Error: ALREADY_JOINED
    else Not Joined
        Backend->>Database: INSERT INTO campaign_participation
        Backend->>Database: Increment questersCount
        Backend->>Database: COMMIT
        Backend-->>User: { message: "Joined campaign" }
    end
```

#### **POST** `/api/campaigns/:id/join`
```bash
# Request
POST /api/campaigns/6f52e91b-b538-4af2-b11d-faffc12a3084/join
Authorization: Bearer {accessToken}

# Response
{
  "success": true,
  "data": {
    "message": "Joined campaign"
  },
  "error": null
}
```

---

### 8️⃣ View Campaign Tasks

#### **GET** `/api/campaigns/:id/tasks`
```bash
# Request
GET /api/campaigns/6f52e91b-b538-4af2-b11d-faffc12a3084/tasks

# Response
{
  "success": true,
  "data": [
    {
      "id": "9c856f30-7e61-41f8-99cf-e993f528ce45",
      "name": "Follow X Account",
      "description": "Follow @TasmilFinance on X",
      "urlAction": "https://x.com/TasmilFinance",
      "rewardPoints": 100,
      "taskType": "X",
      "taskOrder": 1
    },
    {
      "id": "task-2-uuid",
      "name": "Join Telegram",
      "rewardPoints": 150,
      "taskType": "Telegram",
      "taskOrder": 2
    }
  ],
  "error": null
}
```

---

### 9️⃣ Submit Proof for Task

```mermaid
sequenceDiagram
    participant User
    participant Backend
    participant Database

    User->>Backend: POST /api/tasks/{taskId}/submit-proof<br/>{ proofData: "https://x.com/user/status/123" }
    Backend->>Database: Find or Create UserTask
    Backend->>Database: UPDATE status = 'submitted'
    Backend-->>User: { userTask }
```

#### **POST** `/api/tasks/:id/submit-proof`
```bash
# Request
POST /api/tasks/9c856f30-7e61-41f8-99cf-e993f528ce45/submit-proof
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "proofData": "https://x.com/myusername/status/1234567890"
}

# Response
{
  "success": true,
  "data": {
    "id": "user-task-uuid",
    "userId": "user-uuid",
    "taskId": "9c856f30-7e61-41f8-99cf-e993f528ce45",
    "campaignId": "6f52e91b-b538-4af2-b11d-faffc12a3084",
    "status": "submitted",
    "proofData": "https://x.com/myusername/status/1234567890",
    "createdAt": "2025-12-07T03:00:00.000Z"
  },
  "error": null
}
```

---

### 🔟 Admin Approves Task

#### **POST** `/api/admin/user-tasks/:id/approve`
```bash
# Request
POST /api/admin/user-tasks/user-task-uuid/approve
Authorization: Bearer {adminToken}

# Response
{
  "success": true,
  "data": {
    "id": "user-task-uuid",
    "status": "approved",
    "pointsEarned": 100,
    "completedAt": "2025-12-07T04:00:00.000Z"
  },
  "error": null
}
```

---

### 1️⃣1️⃣ User Claims Task Reward

```mermaid
sequenceDiagram
    participant User
    participant Backend
    participant Database

    User->>Backend: POST /api/tasks/{taskId}/claim
    Backend->>Database: BEGIN Transaction
    Backend->>Database: Lock UserTask (FOR UPDATE)
    Backend->>Database: Check status = 'approved'
    Backend->>Database: Check Not Already Claimed (unique constraint)
    Backend->>Database: INSERT INTO task_claims
    Backend->>Database: UPDATE user.totalPoints += points
    Backend->>Database: Trigger Referral Reward (if first task)
    Backend->>Database: COMMIT
    Backend-->>User: { claim }
```

#### **POST** `/api/tasks/:id/claim`
```bash
# Request
POST /api/tasks/9c856f30-7e61-41f8-99cf-e993f528ce45/claim
Authorization: Bearer {accessToken}

# Response
{
  "success": true,
  "data": {
    "id": "claim-uuid",
    "userId": "user-uuid",
    "taskId": "9c856f30-7e61-41f8-99cf-e993f528ce45",
    "campaignId": "campaign-uuid",
    "pointsEarned": 100,
    "claimedAt": "2025-12-07T05:00:00.000Z"
  },
  "error": null
}
```

---

### 1️⃣2️⃣ Check Campaign Completion & Claim

```mermaid
sequenceDiagram
    participant User
    participant Backend
    participant Database

    User->>Backend: GET /api/campaigns/{id}
    Backend->>Database: Get Campaign + User Progress
    Backend-->>User: { campaign, participation, userTasks }
    
    Note over User: If minTasksToComplete reached
    
    User->>Backend: POST /api/campaigns/{id}/claim
    Backend->>Database: BEGIN Transaction
    Backend->>Database: Count Approved Tasks
    Backend->>Database: Check >= minTasksToComplete
    Backend->>Database: INSERT INTO campaign_claims
    Backend->>Database: UPDATE user.totalPoints += campaignRewardPoints
    Backend->>Database: COMMIT
    Backend-->>User: { claim }
```

#### **POST** `/api/campaigns/:id/claim`
```bash
# Request
POST /api/campaigns/6f52e91b-b538-4af2-b11d-faffc12a3084/claim
Authorization: Bearer {accessToken}

# Response
{
  "success": true,
  "data": {
    "id": "campaign-claim-uuid",
    "userId": "user-uuid",
    "campaignId": "6f52e91b-b538-4af2-b11d-faffc12a3084",
    "pointsEarned": 500,
    "claimedAt": "2025-12-07T06:00:00.000Z"
  },
  "error": null
}
```

---

## 🎁 **ADDITIONAL USER FEATURES**

### Daily Login Reward

#### **POST** `/api/users/me/daily-login`
```bash
# Request
POST /api/users/me/daily-login
Authorization: Bearer {accessToken}

# Response (First time today)
{
  "success": true,
  "data": {
    "pointsAwarded": 10
  },
  "error": null
}

# Response (Already claimed)
{
  "success": true,
  "data": {
    "message": "Already claimed today"
  },
  "error": null
}
```

---

### View Points History

#### **GET** `/api/users/:id/points-history`
```bash
# Request
GET /api/users/me/points-history?page=1&limit=20
Authorization: Bearer {accessToken}

# Response
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "points": 100,
        "type": "task",
        "occurredAt": "2025-12-07T05:00:00.000Z",
        "taskId": "9c856f30-7e61-41f8-99cf-e993f528ce45",
        "campaignId": "campaign-uuid"
      },
      {
        "id": "uuid",
        "points": 10,
        "type": "referral",
        "occurredAt": "2025-12-07T04:00:00.000Z"
      }
    ],
    "total": 2
  },
  "error": null
}
```

---

## 🔑 **COMPLETE USER JOURNEY EXAMPLE**

```
1. User connects wallet → GET /api/auth/wallet/nonce
2. Sign message → POST /api/auth/wallet/login → Store tokens
3. Browse campaigns → GET /api/campaigns?active=true
4. Join campaign → POST /api/campaigns/{id}/join
5. View tasks → GET /api/campaigns/{id}/tasks
6. Complete Task 1 → POST /api/tasks/{task1Id}/submit-proof
   → Admin approves → POST /api/admin/user-tasks/{id}/approve
   → User claims → POST /api/tasks/{task1Id}/claim (100 points)
7. Complete Task 2 & 3 similarly
8. Campaign reward → POST /api/campaigns/{id}/claim (500 points)
9. Total points: 100 + 150 + 200 + 500 = 950 points
10. Tier upgraded: Bronze → Silver (at 500 points)
```

---

## 📊 **STATE TRANSITIONS**

### UserTask Status
```
pending → submitted → approved → (claimed via TaskClaim)
          └─→ rejected
```

### Token Lifecycle
```
accessToken (15 min TTL) → Expired → refreshToken → New tokens
                                     └─→ logout → Revoked
```
