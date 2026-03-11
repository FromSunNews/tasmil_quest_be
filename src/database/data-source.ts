import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import initSchemaMigration from './migrations/1710620000000-init-schema';
import { databaseConfig } from 'config';

dotenv.config();

const dbConfig = databaseConfig();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: dbConfig.host,
  port: dbConfig.port,
  username: dbConfig.username,
  password: dbConfig.password,
  database: dbConfig.name,
  synchronize: false,
  logging: dbConfig.logging,
  ssl: {
    rejectUnauthorized: false, // For Supabase PostgreSQL
  },
  entities: ['src/**/*.entity.ts'],
  migrations: [
    initSchemaMigration,
  ],
});

// Run migrations if called from command line
if (require.main === module) {
  const command = process.argv[2];

  AppDataSource.initialize()
    .then(async () => {
      console.log('Data Source has been initialized!');

      if (command === 'migration:run') {
        const migrations = await AppDataSource.runMigrations();
        if (migrations.length > 0) {
          console.log(`✅ Successfully ran ${migrations.length} migration(s):`);
          migrations.forEach((migration) => {
            console.log(`   - ${migration.name}`);
          });
        } else {
          console.log('✅ No pending migrations to run.');
        }
      } else if (command === 'migration:revert') {
        await AppDataSource.undoLastMigration();
        console.log('✅ Last migration has been reverted.');
      } else {
        console.log('Usage: ts-node data-source.ts [migration:run|migration:revert]');
        process.exit(1);
      }

      await AppDataSource.destroy();
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error during Data Source initialization:', error);
      process.exit(1);
    });
}

export default AppDataSource;
