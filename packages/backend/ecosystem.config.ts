module.exports = {
  apps: [
    {
      name: 'app',
      script: './dist/main.js',
      instances: '1',
      exec_mode: 'cluster',
      wait_ready: true,
      listen_timeout: 8000,
      kill_timeout: 5000,
      env_production: {
        NODE_ENV: 'production',
        env_file: '.env',
      },
    },
  ],
};
