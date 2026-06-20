// ecosystem.config.cjs — PM2 process manager config
// Usage: pm2 start ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'brpub-seo',
      script: './apps/seo/.next/standalone/apps/seo/server.js',
      cwd: './',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '127.0.0.1',
        NEXT_PUBLIC_API_URL: 'https://api.brpublications.com',
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      log_file: './logs/seo.log',
      error_file: './logs/seo-error.log',
      out_file: './logs/seo-out.log',
    },
  ],
};
