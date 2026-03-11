# Quick Start - Setup Admin & Seed Data

## ⚡ 5 Phút Setup

### 1️⃣ Database Migration
```bash
npm run typeorm:migration:run
```

### 2️⃣ Frontend Login
```bash
# Frontend cần truy cập tại:
http://localhost:3333

# Login bằng wallet address:
0xdc33a923312ecdcdbef793cb35f2f07a7f5b4bf0
```

### 3️⃣ Add Admin
```bash
npx ts-node -r tsconfig-paths/register scripts/add-admin-wallet.ts 0xdc33a923312ecdcdbef793cb35f2f07a7f5b4bf0
```

### 4️⃣ Seed Campaign & Tasks
```bash
npx ts-node -r tsconfig-paths/register scripts/seed-campaign.ts
```

### 5️⃣ Start Backend
```bash
npm run start:dev
```

---

## 📋 Command Reference

### Add Admin User
```bash
npx ts-node -r tsconfig-paths/register scripts/add-admin-wallet.ts <WALLET_ADDRESS>
```

**Example:**
```bash
npx ts-node -r tsconfig-paths/register scripts/add-admin-wallet.ts 0xdc33a923312ecdcdbef793cb35f2f07a7f5b4bf0
```

### Seed Campaign & Tasks
```bash
npx ts-node -r tsconfig-paths/register scripts/seed-campaign.ts
```

### Run Migrations
```bash
npm run typeorm:migration:run
```

### Revert Last Migration
```bash
npm run typeorm:migration:revert
```

---

## 🔐 Cấp Admin

**Yêu cầu:**
- User phải đã login từ frontend
- Biết wallet address của user

**Workflow:**
1. User login frontend (http://localhost:3333)
2. Chạy script add admin bằng wallet address
3. User refresh frontend
4. User có thể access admin endpoints

---

## 📊 Seed Campaign

**Auto tạo:**
- 1 Campaign: "Join and Share: Support the Tasmil DeFi Revolution!"
- 6 Tasks:
  - Follow Tasmil on X (20 points)
  - Retweet Tasmil's Post (25 points)
  - Comment on Tweet (25 points)
  - Join Discord (15 points)
  - Join Telegram (15 points)
  - Visit Website (10 points)

**Config files:**
- `data/campaign.json` - Campaign metadata
- `data/task.json` - Tasks list

---

## 🌐 API Endpoints

### Admin Endpoints (Yêu cầu Admin Role + Bearer Token)

**Campaigns:**
```
POST   /api/admin/campaigns
PATCH  /api/admin/campaigns/:id
DELETE /api/admin/campaigns/:id
```

**Tasks:**
```
POST   /api/admin/campaigns/:campaignId/tasks
PATCH  /api/admin/tasks/:taskId
DELETE /api/admin/tasks/:taskId
```

**User Tasks:**
```
POST   /api/admin/user-tasks/:id/approve
POST   /api/admin/user-tasks/:id/reject
```

### Public Endpoints

```
GET  /api/campaigns                  # List campaigns
GET  /api/campaigns/:id              # Get campaign detail
GET  /api/tasks                      # List tasks
GET  /api/auth/wallet/nonce          # Get nonce for wallet
POST /api/auth/wallet/login          # Login with signature
```

---

## 🔑 Environment Variables

```bash
# Database
DB_HOST=aws-1-ap-southeast-1.pooler.supabase.com
DB_PORT=6543
DB_USERNAME=postgres.tafrzuqxtuebgwmbzrva
DB_PASSWORD=xxx
DB_NAME=postgres

# Redis
REDIS_HOST=wanted-man-67867.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=xxx
REDIS_TLS=true

# Server
NODE_ENV=development
PORT=5555
API_PREFIX=api
```

---

## 📚 Docs

- Full Guide: [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- Swagger Docs: http://localhost:5555/api/docs

---

## ❓ Common Issues

| Issue | Solution |
|-------|----------|
| User not found | User phải login frontend trước |
| Column does not exist | Chạy `npm run typeorm:migration:run` |
| Redis connection failed | Kiểm tra REDIS credentials trong .env |
| Cannot find module | Thêm `-r tsconfig-paths/register` |
| Port 5555 in use | Kill process hoặc đổi PORT |

---

## 🎯 Next Steps

- [ ] Setup database
- [ ] Add admin user
- [ ] Seed campaign & tasks
- [ ] Start backend
- [ ] Login frontend
- [ ] Test admin endpoints
- [ ] Deploy

Vậy là xong! 🚀
