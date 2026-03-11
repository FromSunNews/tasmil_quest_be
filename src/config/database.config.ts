import { registerAs } from '@nestjs/config';

type DatabaseType = 'postgres';

export default registerAs('database', () => ({
  type: (process.env.DB_TYPE ?? 'postgres') as DatabaseType,
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  name: process.env.DB_NAME ?? 'tasmil',
  logging: process.env.DB_LOGGING === 'true',
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false, // For Supabase PostgreSQL
  } : false,
}));

