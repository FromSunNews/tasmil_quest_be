require('dotenv').config();

module.exports = {
  apps: [
    {
      name: 'tasmil-backend',
      script: './dist/main.js',
      cwd: './',
      env_file: './.env',
      env: {
        NODE_ENV: 'development',
        PORT: 5555,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5555,
        REDIS_HOST: process.env.REDIS_HOST || 'localhost',
        REDIS_PORT: process.env.REDIS_PORT || '6379',
        REDIS_PASSWORD: process.env.REDIS_PASSWORD,
        REDIS_TLS: process.env.REDIS_TLS || 'true',
        DB_HOST: process.env.DB_HOST || 'localhost',
        DB_PORT: process.env.DB_PORT || '5432',
        DB_NAME: process.env.DB_NAME || 'postgres',
        DB_USERNAME: process.env.DB_USERNAME || 'postgres',
        DB_PASSWORD: process.env.DB_PASSWORD,
        DB_SSL: process.env.DB_SSL || 'true',
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      ignore_watch: ['node_modules', 'dist', 'coverage', '.git'],
      max_memory_restart: '500M',
      error_file: './logs/pm2/error.log',
      out_file: './logs/pm2/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000,
      wait_ready: false,
      listen_timeout: 10000,
    },
  ],
};
