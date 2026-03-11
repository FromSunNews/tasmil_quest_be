import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { Wallet } from 'ethers';
import { randomBytes } from 'crypto';
import { User } from '../src/modules/users/entities/user.entity';
import { UserRole } from '../src/common/enums/user-role.enum';
import { Campaign } from '../src/modules/campaigns/entities/campaign.entity';
import { Task } from '../src/modules/tasks/entities/task.entity';

process.env.MOCK_REDIS = 'true';
process.env.DB_TYPE = 'sqljs';
process.env.DB_SQLITE_PATH = ':memory:';

describe('Quest flows (e2e)', () => {
  let app: INestApplication;
  let httpServer: any;
  let dataSource: DataSource;
  const userWallet = new Wallet(`0x${randomBytes(32).toString('hex')}`);
  const adminWallet = new Wallet(`0x${randomBytes(32).toString('hex')}`);
  let campaign: Campaign;
  let task: Task;

  beforeAll(async () => {
    try {
      const { AppModule } = await import('../src/app.module');
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      await app.init();
      httpServer = app.getHttpServer();
      dataSource = app.get(DataSource);
      await seedData();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('E2E setup failure:', error);
      throw error;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  const seedData = async () => {
    const userRepo = dataSource.getRepository(User);
    const campaignRepo = dataSource.getRepository(Campaign);
    const taskRepo = dataSource.getRepository(Task);

    await userRepo.save(
      userRepo.create({
        username: 'admin',
        walletAddress: adminWallet.address.toLowerCase(),
        referralCode: 'admin-code',
        role: UserRole.Admin,
      }),
    );

    campaign = await campaignRepo.save(
      campaignRepo.create({
        title: 'Launch Quest',
        rewardPoints: 400,
        minTasksToComplete: 1,
      }),
    );

    task = await taskRepo.save(
      taskRepo.create({
        campaignId: campaign.id,
        name: 'Follow on X',
        rewardPoints: 150,
        taskOrder: 1,
      }),
    );
  };

  const loginWithWallet = async (wallet: Wallet) => {
    const nonceResponse = await request(httpServer)
      .get('/auth/wallet/nonce')
      .query({ wallet_address: wallet.address, walletAddress: wallet.address })
      .expect(200);

    const nonce = nonceResponse.body.data.nonce;
    const signature = await wallet.signMessage(
      `Tasmil Login Nonce: ${nonce}`,
    );

    const loginResponse = await request(httpServer)
      .post('/auth/wallet/login')
      .send({
        wallet_address: wallet.address,
        walletAddress: wallet.address,
        signature,
      })
      .expect(201);

    return loginResponse.body.data;
  };

  it('allows wallet login, quest submission, approval, and claims', async () => {
    try {
      const userTokens = await loginWithWallet(userWallet);

      await request(httpServer)
        .post(`/campaigns/${campaign.id}/join`)
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .expect(201);

      await request(httpServer)
        .post(`/tasks/${task.id}/submit-proof`)
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .send({ proofData: 'https://twitter.com/demo' })
        .expect(201);

      const statusRes = await request(httpServer)
        .get(`/tasks/${task.id}/status`)
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .expect(200);
      const userTaskId = statusRes.body.data.id;

      const adminTokens = await loginWithWallet(adminWallet);

      await request(httpServer)
        .post(`/admin/user-tasks/${userTaskId}/approve`)
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .expect(201);

      await request(httpServer)
        .post(`/tasks/${task.id}/claim`)
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .expect(201);

      await request(httpServer)
        .post(`/campaigns/${campaign.id}/claim`)
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .expect(201);
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error('E2E failure payload:', error?.response?.body ?? error);
      throw error;
    }
  });
});
