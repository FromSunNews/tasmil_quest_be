import 'reflect-metadata';
import { AppDataSource } from '../src/database/data-source';
import * as fs from 'fs';
import * as path from 'path';

interface Campaign {
  title: string;
  description?: string;
  descriptionDetail?: string;
  coverUrl?: string;
  category: string;
  rewardPoints: number;
  minTasksToComplete: number;
  startAt: string;
  endAt: string;
}

interface Task {
  name: string;
  title: string;
  description: string;
  urlAction: string;
  rewardPoints: number;
  taskType: string;
  checkId: string;
  taskOrder: number;
}

async function seedCampaign() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Connected to database');

    // Read campaign data
    const campaignPath = path.join(__dirname, '../data/campaign.json');
    const campaignData: Campaign = JSON.parse(fs.readFileSync(campaignPath, 'utf-8'));

    // Read tasks data
    const tasksPath = path.join(__dirname, '../data/task.json');
    const tasksData: Task[] = JSON.parse(fs.readFileSync(tasksPath, 'utf-8'));

    console.log('📋 Campaign data:', campaignData.title);
    console.log(`📝 Found ${tasksData.length} tasks`);

    // Create campaign
    const campaignResult = await AppDataSource.query(
      `INSERT INTO campaigns (
        title, description, description_detail, cover_url, category,
        reward_points, min_tasks_to_complete, start_at, end_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING id, title`,
      [
        campaignData.title,
        campaignData.description,
        campaignData.descriptionDetail,
        campaignData.coverUrl,
        campaignData.category,
        campaignData.rewardPoints,
        campaignData.minTasksToComplete,
        campaignData.startAt,
        campaignData.endAt,
      ]
    );

    const campaignId = campaignResult[0].id;
    console.log(`✅ Campaign created: ${campaignResult[0].title} (ID: ${campaignId})`);

    // Create tasks
    for (const task of tasksData) {
      const taskResult = await AppDataSource.query(
        `INSERT INTO tasks (
          campaign_id, name, title, description, url_action,
          reward_points, task_type, check_id, task_order, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING id, title`,
        [
          campaignId,
          task.name,
          task.title,
          task.description,
          task.urlAction,
          task.rewardPoints,
          task.taskType,
          task.checkId,
          task.taskOrder,
        ]
      );

      console.log(`  ✅ Task created: ${taskResult[0].title}`);
    }

    console.log('\n🎉 Seed completed successfully!');
    console.log(`Campaign ID: ${campaignId}`);
    console.log(`Total tasks: ${tasksData.length}`);

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error seeding campaign:', error);
    process.exit(1);
  }
}

seedCampaign();
