# Scripts Documentation

## 📑 Index
1. [add-admin-wallet.ts](#add-admin-walletts)
2. [seed-campaign.ts](#seed-campaignts)

---

## add-admin-wallet.ts

### Vị trí
```
scripts/add-admin-wallet.ts
```

### Mục đích
Cấp quyền admin cho một user dựa trên wallet address của họ.

### Yêu cầu
- User phải **đã tồn tại** trong database (đã login từ frontend)
- Wallet address phải **lowercase**
- Database connection phải hoạt động

### Cách dùng

#### Basic Usage
```bash
npx ts-node -r tsconfig-paths/register scripts/add-admin-wallet.ts <WALLET_ADDRESS>
```

#### Example
```bash
npx ts-node -r tsconfig-paths/register scripts/add-admin-wallet.ts 0xdc33a923312ecdcdbef793cb35f2f07a7f5b4bf0
```

### Output

**Thành công:**
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

**Lỗi - User không tìm thấy:**
```
✅ Connected to database
❌ User with wallet 0xdc33a923312ecdcdbef793cb35f2f07a7f5b4bf0 not found
```

**Lỗi - Database connection:**
```
❌ Error: connect ECONNREFUSED 127.0.0.1:5432
```

### Flow Chi Tiết

```
1. Nhận wallet address từ command line argument
2. Validate wallet address có được cung cấp
3. Kết nối tới database
4. Tìm user bằng wallet address (case-insensitive query)
5. Nếu user không tìm thấy → Error exit
6. Update role từ 'user' → 'admin'
7. Verify update bằng cách query lại
8. In kết quả và disconnect
```

### Code Structure

```typescript
async function addAdminWallet() {
  // 1. Parse arguments
  const walletAddress = process.argv[2];

  // 2. Validate arguments
  if (!walletAddress) {
    console.error('❌ Wallet address is required');
    process.exit(1);
  }

  try {
    // 3. Initialize database
    await AppDataSource.initialize();

    // 4. Check if user exists
    const user = await AppDataSource.query(
      'SELECT ... FROM users WHERE wallet_address = $1',
      [walletAddress]
    );

    if (user.length === 0) {
      console.error('❌ User with wallet ... not found');
      process.exit(1);
    }

    // 5. Update role to admin
    await AppDataSource.query(
      'UPDATE users SET role = $1 WHERE wallet_address = $2',
      ['admin', walletAddress]
    );

    // 6. Verify update
    const updatedUser = await AppDataSource.query(
      'SELECT ... FROM users WHERE wallet_address = $1',
      [walletAddress]
    );

    // 7. Print results
    console.log('✅ User ... is now admin');
    console.log('Updated user:', updatedUser[0]);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}
```

### Database Query

```sql
-- Find user by wallet address
SELECT id, username, wallet_address, role
FROM users
WHERE wallet_address = $1

-- Update user role
UPDATE users
SET role = $1
WHERE wallet_address = $2
```

### Troubleshooting

| Error | Nguyên nhân | Giải pháp |
|-------|-----------|----------|
| User not found | Wallet chưa tồn tại | Login frontend trước |
| Cannot connect to database | DB offline | Check DB connection |
| Column does not exist | Schema mismatch | Run migrations |
| Invalid wallet format | Wallet không hợp lệ | Check wallet address |

### Exit Codes
- `0` - Success
- `1` - Error (user not found, connection error, etc)

---

## seed-campaign.ts

### Vị trí
```
scripts/seed-campaign.ts
```

### Mục đích
Tự động tạo campaign và tasks từ JSON data files.

### Yêu cầu
- Database connection phải hoạt động
- Files tồn tại:
  - `data/campaign.json`
  - `data/task.json`
- User không cần login (script chạy trực tiếp trên DB)

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
  ✅ Task created: Comment on Tasmil's Tweet: 'The Structure Behind Tasmil Finance'
  ✅ Task created: Join the Tasmil Discord Server
  ✅ Task created: Join the Tasmil Telegram Channel
  ✅ Task created: Visit the Tasmil Website

🎉 Seed completed successfully!
Campaign ID: 6a3d3fa0-4a4a-4d18-bc19-1d3d1155687b
Total tasks: 6
```

### Flow Chi Tiết

```
1. Kết nối database
2. Đọc campaign.json
3. Đọc task.json
4. INSERT campaign → Database
5. Lấy campaign ID
6. FOR EACH task:
   INSERT task with campaign_id → Database
7. Print success report
8. Disconnect database
```

### Data Files Format

#### campaign.json

```json
{
  "title": "Join and Share: Support the Tasmil DeFi Revolution!",
  "description": "Join Tasmil's community and help spread the word about our AI-powered DeFi platform to earn reward points.",
  "descriptionDetail": "### 🌐 About Tasmil\n...",
  "coverUrl": "https://tasmil.gitbook.io/...",
  "category": "DeFi",
  "rewardPoints": 100,
  "minTasksToComplete": 3,
  "startAt": "2025-12-11T00:00:00Z",
  "endAt": "2025-12-31T23:59:59Z"
}
```

**Trường:**
| Trường | Type | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| title | string | ✅ | Tên campaign (max 255 chars) |
| description | string | ❌ | Mô tả ngắn |
| descriptionDetail | string | ❌ | Mô tả dài (markdown) |
| coverUrl | string | ❌ | URL ảnh bìa |
| category | string | ❌ | Danh mục (DeFi, NFT, etc) |
| rewardPoints | number | ✅ | Tổng điểm thưởng |
| minTasksToComplete | number | ✅ | Số task tối thiểu |
| startAt | ISO 8601 | ❌ | Ngày bắt đầu |
| endAt | ISO 8601 | ❌ | Ngày kết thúc |

#### task.json

```json
[
  {
    "name": "Follow Tasmil on X (Twitter)",
    "title": "Follow Tasmil on X (Twitter)",
    "description": "Follow the official **[Tasmil X account](...)** to stay updated...",
    "urlAction": "https://x.com/intent/follow?screen_name=tasmilfinance",
    "rewardPoints": 20,
    "taskType": "X_Follow",
    "checkId": "tasmilfinance",
    "taskOrder": 0
  },
  ...
]
```

**Trường:**
| Trường | Type | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| name | string | ✅ | Tên internal (max 255 chars) |
| title | string | ✅ | Tiêu đề hiển thị |
| description | string | ❌ | Mô tả (markdown) |
| urlAction | string | ❌ | URL action link |
| rewardPoints | number | ✅ | Điểm thưởng |
| taskType | string | ✅ | Loại task (X_Follow, Discord, etc) |
| checkId | string | ✅ | ID verify task completion |
| taskOrder | number | ✅ | Thứ tự hiển thị (0, 1, 2...) |

### Task Types

| Type | checkId | Ví dụ |
|------|---------|--------|
| X_Follow | Username | "tasmilfinance" |
| X_Retweet | Tweet ID | "1978001753187688466" |
| X_Comment | Tweet ID | "1981754207800832019" |
| Discord | Server ID | "RWYAx6Sv" |
| Telegram | Channel ID | "bjPjw-8mb7FkZmRl" |
| Visit | Domain | "tasmil-finance.xyz" |
| Onchain | Contract | "0x..." |

### Code Structure

```typescript
async function seedCampaign() {
  try {
    // 1. Initialize database
    await AppDataSource.initialize();

    // 2. Read campaign data
    const campaignPath = path.join(__dirname, '../data/campaign.json');
    const campaignData = JSON.parse(fs.readFileSync(campaignPath, 'utf-8'));

    // 3. Read tasks data
    const tasksPath = path.join(__dirname, '../data/task.json');
    const tasksData = JSON.parse(fs.readFileSync(tasksPath, 'utf-8'));

    // 4. Create campaign
    const campaignResult = await AppDataSource.query(
      'INSERT INTO campaigns (...) VALUES (...) RETURNING id, title',
      [...]
    );
    const campaignId = campaignResult[0].id;

    // 5. Create tasks
    for (const task of tasksData) {
      const taskResult = await AppDataSource.query(
        'INSERT INTO tasks (...) VALUES (...) RETURNING id, title',
        [campaignId, ...]
      );
      console.log(`  ✅ Task created: ${taskResult[0].title}`);
    }

    // 6. Print report
    console.log('🎉 Seed completed successfully!');
    console.log(`Campaign ID: ${campaignId}`);
    console.log(`Total tasks: ${tasksData.length}`);

  } catch (error) {
    console.error('❌ Error seeding campaign:', error);
    process.exit(1);
  }
}
```

### Database Queries

```sql
-- Create campaign
INSERT INTO campaigns (
  title, description, description_detail, cover_url, category,
  reward_points, min_tasks_to_complete, start_at, end_at, created_at
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
RETURNING id, title;

-- Create task
INSERT INTO tasks (
  campaign_id, name, title, description, url_action,
  reward_points, task_type, check_id, task_order, created_at
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
RETURNING id, title;
```

### File Operations

```typescript
// Đọc campaign.json
const campaignPath = path.join(__dirname, '../data/campaign.json');
const campaignData = JSON.parse(fs.readFileSync(campaignPath, 'utf-8'));

// Đọc task.json
const tasksPath = path.join(__dirname, '../data/task.json');
const tasksData = JSON.parse(fs.readFileSync(tasksPath, 'utf-8'));
```

### Troubleshooting

| Error | Nguyên nhân | Giải pháp |
|-------|-----------|----------|
| File not found | Data files không tồn tại | Check `data/` folder |
| Invalid JSON | JSON format sai | Validate JSON syntax |
| Column does not exist | Schema mismatch | Run migrations |
| Cannot connect to database | DB offline | Check connection |
| Duplicate key violation | Campaign đã tồn tại | Delete và seed lại |

### Exit Codes
- `0` - Success
- `1` - Error (file not found, JSON error, DB error, etc)

### Idempotency

Script này **không idempotent** - nếu chạy lần 2 sẽ tạo campaign duplicate.

**Giải pháp nếu cần seed lại:**
```sql
-- Delete campaigns and tasks
DELETE FROM campaigns WHERE title = 'Join and Share: Support the Tasmil DeFi Revolution!';

-- Hoặc delete all
DELETE FROM campaigns;
DELETE FROM tasks;

-- Sau đó chạy seed script lại
```

---

## Common Patterns

### Error Handling

```typescript
try {
  await AppDataSource.initialize();
  // ... code
} catch (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}
```

### Database Operations

```typescript
// Query
const result = await AppDataSource.query(
  'SELECT * FROM users WHERE wallet_address = $1',
  [walletAddress]
);

// Insert
const result = await AppDataSource.query(
  'INSERT INTO ... VALUES (...) RETURNING ...',
  [params]
);

// Update
await AppDataSource.query(
  'UPDATE ... SET ... WHERE ...',
  [params]
);
```

### File Reading

```typescript
import * as fs from 'fs';
import * as path from 'path';

const filePath = path.join(__dirname, '../data/campaign.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
```

---

## Tips

1. **Wallet Address Case:** Database lưu lowercase, nhưng script accept bất kỳ case nào
2. **Script Reusability:** Có thể chạy nhiều lần (nhưng seed-campaign tạo duplicate)
3. **Logging:** Console.log dùng cho info, console.error dùng cho errors
4. **Exit Codes:** Luôn exit(0) for success, exit(1) for error

---

## Maintenance

### Thêm Script Mới

1. Tạo file mới trong `scripts/`
2. Export async function `main()`
3. Call `main()` ở cuối file
4. Add entry trong `package.json` nếu cần

### Update Data

Chỉnh sửa:
- `data/campaign.json` - Campaign metadata
- `data/task.json` - Tasks list

Chạy seed lại:
```bash
# Delete old data
DELETE FROM campaigns;

# Seed new data
npx ts-node -r tsconfig-paths/register scripts/seed-campaign.ts
```

---

Tài liệu đầy đủ: [SETUP_GUIDE.md](./SETUP_GUIDE.md)
Quick Start: [QUICK_START.md](./QUICK_START.md)
