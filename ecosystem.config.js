module.exports = {
  apps: [
    {
      name: 'healthy-club',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3020',
      cwd: '/var/www/healthy-club',
      env: {
        NODE_ENV: 'production',
        PORT: 3020,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
    },
  ],
};
