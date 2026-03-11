# Setup Guide - Admin & Seed Data Scripts

## Mục lục
1. [Database Setup](#database-setup)
2. [Add Admin User Script](#add-admin-user-script)
3. [Seed Campaign & Tasks Script](#seed-campaign--tasks-script)
4. [Toàn bộ Setup Flow](#toàn-bộ-setup-flow)

---

## Database Setup

### Yêu cầu
- Supabase PostgreSQL database (hoặc PostgreSQL khác)
- Redis instance (Upstash hoặc local)
- Node.js và pnpm

### 1. Cấu hình Environment Variables

```bash
# .env
DB_HOST=aws-1-ap-southeast-1.pooler.supabase.com
DB_PORT=6543
DB_USERNAME=postgres.tafrzuqxtuebgwmbzrva
DB_PASSWORD=<password>
DB_NAME=postgres
DB_SSL=true

REDIS_HOST=wanted-man-67867.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=<redis_password>
REDIS_TLS=true
```

### 2. Chạy Migrations

```bash
npm run typeorm:migration:run
```

---

## Add Admin User Script

### Mô tả
Script này dùng để cấp quyền admin cho một user dựa trên wallet address.

**File:** `scripts/add-admin-wallet.ts`

### Cách dùng

```bash
npx ts-node -r tsconfig-paths/register scripts/add-admin-wallet.ts <wallet_address>
```

### Ví dụ

```bash
npx ts-node -r tsconfig-paths/register scripts/add-admin-wallet.ts 0xdc33a923312ecdcdbef793cb35f2f07a7f5b4bf0
```

### Output

```
✅ Connected to database
Found user: {
  id: '325eea58-c17d-46a7-91ff-310bf2217aea',
  username: 'user_5b4bf0',
  wallet_address: '0xdc33a923312ecdcdbef793cb35f2f07a7f5b4bf0',
  role: 'user'
}
✅ User user_5b4bf0 (0xdc33a923312ecdcdbef793cb35f2f07a7f5b4bf0) is now admin
Updated user: {
  id: '325eea58-c17d-46a7-91ff-310bf2217aea',
  username: 'user_5b4bf0',
  wallet_address: '0xdc33a923312ecdcdbef793cb35f2f07a7f5b4bf0',
  role: 'admin'
}
✅ Success!
```

### Lưu ý
- User phải **đã tồn tại** trong database (phải đã login từ frontend)
- Wallet address phải **lowercase**
- Role sẽ được thay đổi từ `user` thành `admin`

### Quản lý Admin Endpoints

Sau khi trở thành admin, user có thể truy cập:

```
POST /api/admin/campaigns                    # Tạo campaign
PATCH /api/admin/campaigns/:id               # Cập nhật campaign
DELETE /api/admin/campaigns/:id              # Xóa campaign

POST /api/admin/campaigns/:campaignId/tasks  # Thêm task
PATCH /api/admin/tasks/:taskId               # Cập nhật task
DELETE /api/admin/tasks/:taskId              # Xóa task

POST /api/admin/user-tasks/:id/approve       # Approve user task
POST /api/admin/user-tasks/:id/reject        # Reject user task
```

---

## Seed Campaign & Tasks Script

### Mô tả
Script này tự động tạo campaign và tasks từ file JSON.

**File:** `scripts/seed-campaign.ts`

**Data Files:**
- `data/campaign.json` - Thông tin campaign
- `data/task.json` - Danh sách tasks

### Cách dùng

```bash
npx ts-node -r tsconfig-paths/register scripts/seed-campaign.ts
```

### Output

```
✅ Connected to database
📋 Campaign data: Join and Share: Support the Tasmil DeFi Revolution!
📝 Found 6 tasks
✅ Campaign created: Join and Share: Support the Tasmil DeFi Revolution!
   (ID: 6a3d3fa0-4a4a-4d18-bc19-1d3d1155687b)
  ✅ Task created: Follow Tasmil on X (Twitter)
  ✅ Task created: Retweet Tasmil's Pinned Post
  ✅ Task created: Comment on Tasmil's Tweet
  ✅ Task created: Join the Tasmil Discord Server
  ✅ Task created: Join the Tasmil Telegram Channel
  ✅ Task created: Visit the Tasmil Website

🎉 Seed completed successfully!
Campaign ID: 6a3d3fa0-4a4a-4d18-bc19-1d3d1155687b
Total tasks: 6
```

### Campaign JSON Format

**File:** `data/campaign.json`

```json
{
  "title": "Campaign Title",
  "description": "Short description",
  "descriptionDetail": "Long description with markdown",
  "coverUrl": "https://...",
  "category": "DeFi",
  "rewardPoints": 100,
  "minTasksToComplete": 3,
  "startAt": "2025-12-11T00:00:00Z",
  "endAt": "2025-12-31T23:59:59Z"
}
```

**Giải thích fields:**
- `title` (string): Tên campaign (max 255 ký tự)
- `description` (string): Mô tả ngắn
- `descriptionDetail` (string): Mô tả chi tiết (hỗ trợ markdown)
- `coverUrl` (string): URL ảnh bìa
- `category` (string): Danh mục (DeFi, NFT, Gaming, etc.)
- `rewardPoints` (number): Điểm thưởng tổng cộng
- `minTasksToComplete` (number): Số task tối thiểu phải hoàn thành
- `startAt` (ISO 8601): Thời gian bắt đầu
- `endAt` (ISO 8601): Thời gian kết thúc

### Tasks JSON Format

**File:** `data/task.json`

```json
[
  {
    "name": "Follow Tasmil on X",
    "title": "Follow Tasmil on X (Twitter)",
    "description": "Follow the official [Tasmil X account](...)",
    "urlAction": "https://x.com/intent/follow?screen_name=tasmilfinance",
    "rewardPoints": 20,
    "taskType": "X_Follow",
    "checkId": "tasmilfinance",
    "taskOrder": 0
  }
]
```

**Giải thích fields:**
- `name` (string): Tên task nội bộ
- `title` (string): Tiêu đề hiển thị (max 255 ký tự)
- `description` (string): Mô tả task (hỗ trợ markdown)
- `urlAction` (string): URL action (link để user click)
- `rewardPoints` (number): Điểm thưởng khi hoàn thành
- `taskType` (string): Loại task
  - `X_Follow` - Follow trên X/Twitter
  - `X_Retweet` - Retweet bài viết
  - `X_Comment` - Comment bài viết
  - `Discord` - Join Discord server
  - `Telegram` - Join Telegram channel
  - `Visit` - Truy cập website
  - Các loại khác...
- `checkId` (string): ID để verify task completion
  - Cho X_Follow: username (vd: "tasmilfinance")
  - Cho X_Retweet/X_Comment: tweet_id
  - Cho Discord: server_id
  - Cho Telegram: channel_id
  - Cho Visit: domain
- `taskOrder` (number): Thứ tự hiển thị (0, 1, 2, ...)

---

## Toàn bộ Setup Flow

### Step 1: Chuẩn bị
```bash
# 1. Install dependencies
pnpm install

# 2. Cấu hình .env file
# - Database credentials
# - Redis credentials
```

### Step 2: Database & Migrations
```bash
# Chạy migrations để tạo schema
npm run typeorm:migration:run
```

### Step 3: User Login (Frontend)
```bash
# 1. Start frontend
cd ../frontend
npm run dev

# 2. Login bằng wallet address cần làm admin
# Ví dụ: 0xdc33a923312ecdcdbef793cb35f2f07a7f5b4bf0
```

### Step 4: Cấp Admin Role
```bash
# Backend terminal
npx ts-node -r tsconfig-paths/register scripts/add-admin-wallet.ts 0xdc33a923312ecdcdbef793cb35f2f07a7f5b4bf0
```

### Step 5: Seed Campaign & Tasks
```bash
# Tạo campaign và tasks từ JSON files
npx ts-node -r tsconfig-paths/register scripts/seed-campaign.ts
```

### Step 6: Start Backend
```bash
npm run start:dev
```

### Step 7: Test
```bash
# Backend running tại http://localhost:5555
# Frontend running tại http://localhost:3333

# Swagger Docs
http://localhost:5555/api/docs

# Login và view campaign
http://localhost:3333
```

---

## Troubleshooting

### Error: User not found
**Nguyên nhân:** Wallet address chưa tồn tại trong database
**Giải pháp:** User phải login từ frontend trước

### Error: Column "X" does not exist
**Nguyên nhân:** Database schema chưa được cập nhật
**Giải pháp:** Chạy `npm run typeorm:migration:run`

### Error: Redis connection failed
**Nguyên nhân:** Redis credentials không đúng hoặc connection không available
**Giải pháp:** Kiểm tra REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_TLS trong .env

### Error: Cannot find module
**Nguyên nhân:** TypeScript path aliases chưa được resolve
**Giải pháp:** Thêm `-r tsconfig-paths/register` vào command

---

## Các NPM Scripts Liên Quan

```json
{
  "typeorm:migration:run": "Chạy migrations",
  "typeorm:migration:revert": "Revert migration cuối",
  "seed": "Chạy seed script (nếu có)",
  "update-admin": "Cấp admin cho user (deprecated)",
  "start:dev": "Start backend development server",
  "start:prod": "Start backend production"
}
```

---

## File Scripts

### `/scripts/add-admin-wallet.ts`
- Thêm quyền admin cho user dựa trên wallet address
- Kiểm tra user tồn tại trước khi update
- Verify role sau khi update

### `/scripts/seed-campaign.ts`
- Đọc campaign data từ `data/campaign.json`
- Đọc tasks data từ `data/task.json`
- Tạo campaign và tất cả tasks có liên kết
- Trả về campaign ID và số lượng tasks

---

## Tài liệu Thêm

- [NestJS Docs](https://docs.nestjs.com)
- [TypeORM Docs](https://typeorm.io)
- [Supabase Docs](https://supabase.com/docs)
- [Redis Docs](https://redis.io/docs)
