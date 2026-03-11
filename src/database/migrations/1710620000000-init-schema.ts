import { MigrationInterface, QueryRunner } from 'typeorm';

export default class InitSchema1710620000000 implements MigrationInterface {
  name = 'InitSchema1710620000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Remove uuid-ossp extension as it's not allowed in Azure PostgreSQL
    // Use gen_random_uuid() instead which is available by default
    
    await queryRunner.query(
      `CREATE TYPE "public"."user_tier_enum" AS ENUM('Bronze','Silver','Gold','Platinum','Diamond')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."campaign_category_enum" AS ENUM('DeFi','NFT','Infra','Gaming','Other')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."task_type_enum" AS ENUM('Telegram','Discord','X','X_Follow','X_Retweet','X_Comment','X_Like','Website','Gaming','Visit','Onchain','Other')`,
    );

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "username" varchar(50) NOT NULL UNIQUE,
        "wallet_address" varchar(42) NOT NULL UNIQUE,
        "avatar_url" text,
        "tier" "public"."user_tier_enum" NOT NULL DEFAULT 'Bronze',
        "total_points" integer NOT NULL DEFAULT 0,
        "login_streak" integer NOT NULL DEFAULT 0,
        "last_login_at" timestamptz,
        "referral_code" varchar(50) UNIQUE,
        "referred_by" uuid,
        "role" varchar(20) NOT NULL DEFAULT 'user',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_users_referred_by" FOREIGN KEY ("referred_by") REFERENCES "users" ("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_users_wallet_address" ON "users" ("wallet_address")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_users_total_points" ON "users" ("total_points")`,
    );

    await queryRunner.query(`
      CREATE TABLE "campaigns" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" varchar(255) NOT NULL,
        "description" text,
        "description_detail" text,
        "cover_url" text,
        "category" "public"."campaign_category_enum",
        "reward_points" integer NOT NULL,
        "min_tasks_to_complete" integer NOT NULL,
        "questers_count" integer NOT NULL DEFAULT 0,
        "start_at" timestamptz,
        "end_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_campaigns_category" ON "campaigns" ("category")`,
    );

    await queryRunner.query(`
      CREATE TABLE "tasks" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "campaign_id" uuid NOT NULL,
        "name" varchar(255) NOT NULL,
        "title" varchar(255),
        "description" text,
        "url_action" text,
        "reward_points" integer NOT NULL,
        "task_type" "public"."task_type_enum",
        "check_id" varchar(500),
        "task_order" integer NOT NULL DEFAULT 0,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_tasks_campaign" FOREIGN KEY ("campaign_id") REFERENCES "campaigns" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_tasks_campaign_order" ON "tasks" ("campaign_id","task_order")`,
    );

    await queryRunner.query(`
      CREATE TABLE "campaign_participation" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "campaign_id" uuid NOT NULL,
        "joined_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_participation_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_participation_campaign" FOREIGN KEY ("campaign_id") REFERENCES "campaigns" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_campaign_participation_user_campaign" ON "campaign_participation" ("user_id","campaign_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "user_tasks" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "campaign_id" uuid NOT NULL,
        "task_id" uuid NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'pending',
        "proof_data" text,
        "completed_at" timestamptz,
        "points_earned" integer NOT NULL DEFAULT 0,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_user_tasks_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_user_tasks_campaign" FOREIGN KEY ("campaign_id") REFERENCES "campaigns" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_user_tasks_task" FOREIGN KEY ("task_id") REFERENCES "tasks" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_user_tasks_user_id" ON "user_tasks" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_user_tasks_campaign_id" ON "user_tasks" ("campaign_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_user_tasks_task_id" ON "user_tasks" ("task_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_user_task_user_task" ON "user_tasks" ("user_id","task_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "task_claims" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid,
        "campaign_id" uuid,
        "task_id" uuid,
        "points_earned" integer NOT NULL,
        "claimed_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_task_claim_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_task_claim_campaign" FOREIGN KEY ("campaign_id") REFERENCES "campaigns" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_task_claim_task" FOREIGN KEY ("task_id") REFERENCES "tasks" ("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_task_claims_user_id" ON "task_claims" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_task_claims_campaign_id" ON "task_claims" ("campaign_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_task_claims_task_id" ON "task_claims" ("task_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_task_claim_user_task" ON "task_claims" ("user_id","task_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "campaign_claims" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid,
        "campaign_id" uuid,
        "points_earned" integer NOT NULL,
        "claimed_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_campaign_claim_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_campaign_claim_campaign" FOREIGN KEY ("campaign_id") REFERENCES "campaigns" ("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_campaign_claims_user_id" ON "campaign_claims" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_campaign_claims_campaign_id" ON "campaign_claims" ("campaign_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_campaign_claim_user_campaign" ON "campaign_claims" ("user_id","campaign_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "referral_events" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid,
        "referred_user_id" uuid NOT NULL,
        "points_awarded" integer NOT NULL,
        "user_task_id" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_referral_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid,
        "title" varchar(255) NOT NULL,
        "body" text NOT NULL,
        "metadata" jsonb,
        "is_read" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_notification_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "social_accounts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "platform" varchar(20) NOT NULL,
        "platform_user_id" varchar(100) NOT NULL,
        "username" varchar(100),
        "display_name" varchar(150),
        "avatar_url" text,
        "access_token_encrypted" text,
        "refresh_token_encrypted" text,
        "token_expires_at" timestamptz,
        "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "connected_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_social_accounts_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_social_accounts_user_platform" ON "social_accounts" ("user_id", "platform")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_social_accounts_platform_platform_user_id" ON "social_accounts" ("platform", "platform_user_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_social_accounts_platform_username" ON "social_accounts" ("platform", "username")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_social_accounts_user_id" ON "social_accounts" ("user_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "social_accounts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "referral_events"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "campaign_claims"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "task_claims"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_tasks"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "campaign_participation"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tasks"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "campaigns"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."task_type_enum"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."campaign_category_enum"`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."user_tier_enum"`);
  }
}

