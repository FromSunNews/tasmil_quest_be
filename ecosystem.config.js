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
