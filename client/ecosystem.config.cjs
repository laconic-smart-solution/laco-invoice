module.exports = {
  apps: [
    {
      name: 'laco-invoice',
      script: './node_modules/serve/build/main.js',
      args: '-s dist -l 5173',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
