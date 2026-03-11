# 📘 API Documentation

Complete reference for all API endpoints in Tasmil Finance Incentive Program.

---

## 🔐 **Authentication Endpoints**

### Get Wallet Nonce

Generate a nonce for wallet signature verification.

**Endpoint:** `GET /api/auth/wallet/nonce`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `walletAddress` | string | Yes | Ethereum wallet address (0x...) |

**Response:**
```json
{
  "success": true,
  "data": {
    "walletAddress": "0x8f5e3af89316003a21cf6215480ff1dfb6d2e959",
    "nonce": "a3f5c8e1b2d4f6a8c9e2...",
    "expiresIn": 300
  },
  "error": null
}
```

**Rate Limit:** 1 request per wallet per minute

---

### Wallet Login

Authenticate user with wallet signature.

**Endpoint:** `POST /api/auth/wallet/login`

**Request Body:**
```json
{
  "walletAddress": "0x8f5e3af89316003a21cf6215480ff1dfb6d2e959",
  "signature": "0x4f8a2b3c...",
  "referralCode": "abc123" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "user_2e959",
      "walletAddress": "0x8f5e3af89316003a21cf6215480ff1dfb6d2e959",
      "tier": "Bronze",
      "totalPoints": 0,
      "loginStreak": 1,
      "role": "user",
      "referralCode": "def456"
    }
  },
  "error": null
}
```

**Rate Limit:** 5 requests per IP per minute

---

### Refresh Access Token

Get new access token using refresh token.

**Endpoint:** `POST /api/auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**
```json
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

### Logout

Revoke refresh token.

**Endpoint:** `POST /api/auth/logout`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Logged out"
  },
  "error": null
}
```

---

## 👤 **User Endpoints**

### Get Current User

Get authenticated user profile.

**Endpoint:** `GET /api/users/me`

**Headers:** `Authorization: Bearer {accessToken}`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "user_2e959",
    "walletAddress": "0x8f5e3af89316003a21cf6215480ff1dfb6d2e959",
    "avatarUrl": null,
    "tier": "Bronze",
    "totalPoints": 950,
    "loginStreak": 3,
    "referralCode": "def456",
    "referredById": null,
    "role": "user",
    "createdAt": "2025-12-01T00:00:00.000Z"
  },
  "error": null
}
```

---

### Update Profile

Update user profile.

**Endpoint:** `PATCH /api/users/me`

**Headers:** `Authorization: Bearer {accessToken}`

**Request Body:**
```json
{
  "username": "new_username",
  "avatarUrl": "https://example.com/avatar.png"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "new_username",
    "avatarUrl": "https://example.com/avatar.png",
    // ... other fields
  },
  "error": null
}
```

**Errors:**
- `409` - Username already taken

---

### Get User Profile (Public)

Get public profile of any user.

**Endpoint:** `GET /api/users/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "user_2e959",
    "tier": "Silver",
    "totalPoints": 1500,
    "createdAt": "2025-12-01T00:00:00.000Z"
  },
  "error": null
}
```

---

### Get Points History

Get user's points earning history.

**Endpoint:** `GET /api/users/:id/points-history`

**Headers:** `Authorization: Bearer {accessToken}` (Required)

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "points": 500,
        "type": "campaign",
        "occurredAt": "2025-12-07T06:00:00.000Z",
        "taskId": null,
        "campaignId": "campaign-uuid"
      },
      {
        "id": "uuid",
        "points": 100,
        "type": "task",
        "occurredAt": "2025-12-07T05:00:00.000Z",
        "taskId": "task-uuid",
        "campaignId": "campaign-uuid"
      },
      {
        "id": "uuid",
        "points": 100,
        "type": "referral",
        "occurredAt": "2025-12-07T04:00:00.000Z",
        "taskId": null,
        "campaignId": null
      }
    ],
    "total": 3
  },
  "error": null
}
```

---

### Get Referrals

Get list of referred users.

**Endpoint:** `GET /api/users/me/referrals`

**Headers:** `Authorization: Bearer {accessToken}`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "referred-user-id",
      "username": "user_123",
      "totalPoints": 500,
      "tier": "Bronze",
      "earnedPoints": 100
    }
  ],
  "error": null
}
```

---

### Daily Login Reward

Claim daily login reward.

**Endpoint:** `POST /api/users/me/daily-login`

**Headers:** `Authorization: Bearer {accessToken}`

**Response (First claim today):**
```json
{
  "success": true,
  "data": {
    "pointsAwarded": 10
  },
  "error": null
}
```

**Response (Already claimed):**
```json
{
  "success": true,
  "data": {
    "message": "Already claimed today"
  },
  "error": null
}
```

---

## 🎯 **Campaign Endpoints**

### List Campaigns

Get paginated list of campaigns.

**Endpoint:** `GET /api/campaigns`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 20) |
| `active` | boolean | No | Filter active campaigns |
| `category` | string | No | Filter by category (DeFi, NFT, etc.) |
| `search` | string | No | Search in title/description |

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "6f52e91b-b538-4af2-b11d-faffc12a3084",
        "title": "DeFi Dashboard Quest",
        "description": "Complete tasks to earn rewards",
        "category": "DeFi",
        "rewardPoints": 500,
        "minTasksToComplete": 3,
        "questersCount": 42,
        "startAt": "2025-12-07T00:00:00.000Z",
        "endAt": "2025-12-31T23:59:59.000Z",
        "createdAt": "2025-12-07T02:00:00.000Z"
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

**Caching:** 60 seconds

---

### Get Campaign Details

Get single campaign with tasks and user progress.

**Endpoint:** `GET /api/campaigns/:id`

**Headers:** `Authorization: Bearer {accessToken}` (Optional, for user progress)

**Response (Authenticated):**
```json
{
  "success": true,
  "data": {
    "campaign": {
      "id": "6f52e91b-b538-4af2-b11d-faffc12a3084",
      "title": "DeFi Dashboard Quest",
      "description": "Complete tasks to earn rewards",
      "category": "DeFi",
      "rewardPoints": 500,
      "minTasksToComplete": 3,
      "questersCount": 42,
      "tasks": [
        {
          "id": "task-1-uuid",
          "name": "Follow X Account",
          "rewardPoints": 100,
          "taskType": "X",
          "taskOrder": 1
        }
      ]
    },
    "participation": {
      "id": "participation-uuid",
      "joinedAt": "2025-12-07T03:00:00.000Z"
    },
    "userTasks": [
      {
        "id": "user-task-uuid",
        "taskId": "task-1-uuid",
        "status": "approved",
        "completedAt": "2025-12-07T05:00:00.000Z"
      }
    ]
  },
  "error": null
}
```

---

### Get Campaign Tasks

Get list of tasks for a campaign.

**Endpoint:** `GET /api/campaigns/:id/tasks`

**Response:**
```json
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
      "taskOrder": 1,
      "createdAt": "2025-12-07T02:05:00.000Z"
    }
  ],
  "error": null
}
```

---

### Join Campaign

Join a campaign to participate.

**Endpoint:** `POST /api/campaigns/:id/join`

**Headers:** `Authorization: Bearer {accessToken}`

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Joined campaign"
  },
  "error": null
}
```

**Errors:**
- `404` - Campaign not found
- `400` - Campaign not active
- `409` - Already joined

---

### Claim Campaign Reward

Claim campaign completion reward.

**Endpoint:** `POST /api/campaigns/:id/claim`

**Headers:** `Authorization: Bearer {accessToken}`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "claim-uuid",
    "userId": "user-uuid",
    "campaignId": "6f52e91b-b538-4af2-b11d-faffc12a3084",
    "pointsEarned": 500,
    "claimedAt": "2025-12-07T06:00:00.000Z"
  },
  "error": null
}
```

**Errors:**
- `400` - Campaign not active / Not eligible (incomplete tasks)
- `409` - Already claimed

---

## 📝 **Task Endpoints**

### Get Task Details

Get single task with user status.

**Endpoint:** `GET /api/tasks/:id`

**Headers:** `Authorization: Bearer {accessToken}` (Optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "task": {
      "id": "9c856f30-7e61-41f8-99cf-e993f528ce45",
      "campaignId": "campaign-uuid",
      "name": "Follow X Account",
      "description": "Follow @TasmilFinance",
      "urlAction": "https://x.com/TasmilFinance",
      "rewardPoints": 100,
      "taskType": "X",
      "taskOrder": 1
    },
    "userTask": {
      "id": "user-task-uuid",
      "status": "submitted",
      "proofData": "https://x.com/user/status/123"
    }
  },
  "error": null
}
```

---

### Submit Proof

Submit proof of task completion.

**Endpoint:** `POST /api/tasks/:id/submit-proof`

**Headers:** `Authorization: Bearer {accessToken}`

**Request Body:**
```json
{
  "proofData": "https://x.com/myusername/status/1234567890"
}
```

**Validation:**
- Max length: 5000 characters

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-task-uuid",
    "userId": "user-uuid",
    "taskId": "9c856f30-7e61-41f8-99cf-e993f528ce45",
    "campaignId": "campaign-uuid",
    "status": "submitted",
    "proofData": "https://x.com/myusername/status/1234567890",
    "createdAt": "2025-12-07T03:00:00.000Z"
  },
  "error": null
}
```

**Errors:**
- `404` - Task not found
- `400` - Proof too large (>5000 chars)

---

### Get Task Status

Get user's task completion status.

**Endpoint:** `GET /api/tasks/:id/status`

**Headers:** `Authorization: Bearer {accessToken}`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-task-uuid",
    "status": "approved",
    "pointsEarned": 100,
    "completedAt": "2025-12-07T05:00:00.000Z"
  },
  "error": null
}
```

---

### Claim Task Reward

Claim reward for approved task.

**Endpoint:** `POST /api/tasks/:id/claim`

**Headers:** `Authorization: Bearer {accessToken}`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "claim-uuid",
    "userId": "user-uuid",
    "taskId": "9c856f30-7e61-41f8-99cf-e993f528ce45",
    "campaignId": "campaign-uuid",
    "pointsEarned": 100,
    "claimedAt": "2025-12-07T05:30:00.000Z"
  },
  "error": null
}
```

**Errors:**
- `400` - Task not approved
- `409` - Already claimed

---

### Get Claim Status

Check if task has been claimed.

**Endpoint:** `GET /api/tasks/:id/claim/status`

**Headers:** `Authorization: Bearer {accessToken}`

**Response:**
```json
{
  "success": true,
  "data": {
    "claimed": true,
    "claim": {
      "id": "claim-uuid",
      "pointsEarned": 100,
      "claimedAt": "2025-12-07T05:30:00.000Z"
    }
  },
  "error": null
}
```

---

## 👨‍💼 **Admin Endpoints**

> **Note:** All admin endpoints require `Authorization: Bearer {adminToken}` and `role: admin`

### Create Campaign

Create a new campaign.

**Endpoint:** `POST /api/admin/campaigns`

**Request Body:**
```json
{
  "title": "DeFi Dashboard Quest",
  "description": "Complete tasks to earn rewards",
  "category": "DeFi",
  "rewardPoints": 500,
  "minTasksToComplete": 3,
  "startAt": "2025-12-07T00:00:00.000Z",
  "endAt": "2025-12-31T23:59:59.000Z"
}
```

**Validation:**
- `title`: Required, max 255 chars
- `rewardPoints`: Required, min 1
- `minTasksToComplete`: Required, min 1
- `category`: Optional, enum (DeFi, NFT, Infra, Gaming, Other)
- `startAt`, `endAt`: Optional, ISO 8601 date string

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "6f52e91b-b538-4af2-b11d-faffc12a3084",
    "title": "DeFi Dashboard Quest",
    "category": "DeFi",
    "rewardPoints": 500,
    "minTasksToComplete": 3,
    "questersCount": 0,
    "createdAt": "2025-12-07T02:00:00.000Z"
  },
  "error": null
}
```

---

### Update Campaign

Update existing campaign.

**Endpoint:** `PATCH /api/admin/campaigns/:id`

**Request Body:** (All fields optional)
```json
{
  "title": "Updated Title",
  "rewardPoints": 600
}
```

**Response:** Same as create

---

### Delete Campaign

Delete a campaign.

**Endpoint:** `DELETE /api/admin/campaigns/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "deleted": true
  },
  "error": null
}
```

---

### Add Task to Campaign

Create a new task for a campaign.

**Endpoint:** `POST /api/admin/campaigns/:campaignId/tasks`

**Request Body:**
```json
{
  "name": "Follow X Account",
  "description": "Follow @TasmilFinance on X",
  "urlAction": "https://x.com/TasmilFinance",
  "rewardPoints": 100,
  "taskType": "X",
  "taskOrder": 1
}
```

**Task Types:** `Telegram`, `Discord`, `X`, `Website`, `Gaming`, `Other`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "task-uuid",
    "campaignId": "campaign-uuid",
    "name": "Follow X Account",
    "rewardPoints": 100,
    "taskOrder": 1
  },
  "error": null
}
```

---

### Update Task

Update existing task.

**Endpoint:** `PATCH /api/admin/tasks/:taskId`

**Request Body:** (All fields optional)
```json
{
  "name": "Updated Task Name",
  "rewardPoints": 150
}
```

---

### Delete Task

Delete a task.

**Endpoint:** `DELETE /api/admin/tasks/:taskId`

---

### Approve User Task

Approve user's task submission.

**Endpoint:** `POST /api/admin/user-tasks/:id/approve`

**Response:**
```json
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

**Side Effects:**
- Triggers referral reward if user's first approved task

---

### Reject User Task

Reject user's task submission.

**Endpoint:** `POST /api/admin/user-tasks/:id/reject`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-task-uuid",
    "status": "rejected"
  },
  "error": null
}
```

---

### Get Campaign Claims

Get all claims for a campaign.

**Endpoint:** `GET /api/campaigns/:id/claims`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "claim-uuid",
      "userId": "user-uuid",
      "campaignId": "campaign-uuid",
      "pointsEarned": 500,
      "claimedAt": "2025-12-07T06:00:00.000Z"
    }
  ],
  "error": null
}
```

---

## 📊 **Analytics Endpoints**

### Global Leaderboard

Get top users by points.

**Endpoint:** `GET /api/leaderboard/global`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 10 | Max users to return |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "user-uuid",
      "username": "top_player",
      "totalPoints": 5000,
      "tier": "Platinum"
    }
  ],
  "error": null
}
```

---

### Streak Leaderboard

Get top users by login streak.

**Endpoint:** `GET /api/leaderboard/streak`

**Query Parameters:** Same as global

---

### System Analytics

Get platform-wide statistics.

**Endpoint:** `GET /api/analytics/system`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 1234,
    "totalCampaigns": 45,
    "totalTasks": 180,
    "taskClaims": 5678,
    "campaignClaims": 890
  },
  "error": null
}
```

---

## 🔔 **Notification Endpoints**

### Send Notification (Admin)

Send notification to user or all users.

**Endpoint:** `POST /api/notifications/send`

**Headers:** `Authorization: Bearer {adminToken}`

**Request Body:**
```json
{
  "userId": "user-uuid", // Optional, null = broadcast
  "title": "New Campaign Available!",
  "body": "Check out the latest DeFi quest"
}
```

---

### Get Notifications

Get user's notifications.

**Endpoint:** `GET /api/notifications`

**Headers:** `Authorization: Bearer {accessToken}`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "notif-uuid",
      "userId": "user-uuid",
      "title": "Task Approved!",
      "body": "Your submission was approved",
      "isRead": false,
      "createdAt": "2025-12-07T05:00:00.000Z"
    }
  ],
  "error": null
}
```

---

## 🚨 **Error Responses**

All errors follow this format:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `NONCE_EXPIRED` | 400 | Nonce expired or not found |
| `INVALID_SIGNATURE` | 401 | Wallet signature verification failed |
| `INVALID_UUID` | 400 | Invalid UUID format |
| `USER_NOT_FOUND` | 404 | User not found |
| `CAMPAIGN_NOT_FOUND` | 404 | Campaign not found |
| `TASK_NOT_FOUND` | 404 | Task not found |
| `TASK_NOT_APPROVED` | 400 | Task must be approved before claiming |
| `ALREADY_CLAIMED` | 409 | Reward already claimed |
| `ALREADY_JOINED` | 409 | Already joined campaign |
| `CAMPAIGN_NOT_ACTIVE` | 400 | Campaign not in active period |
| `NOT_ELIGIBLE_FOR_CAMPAIGN_CLAIM` | 400 | Not enough tasks completed |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INVALID_REFRESH_TOKEN` | 401 | Refresh token invalid/expired |

---

## 📖 **Related Documentation**

- [API Flow Guide](./API_FLOW.md) - Visual flow diagrams
- [Architecture](./ARCHITECTURE.md) - System design
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues
