module.exports = {
  apps: [
    {
      name: 'zk-survey-backend',
      script: './dist/main.js',
      instances: '1',
      exec_mode: 'cluster',
      wait_ready: true,
      listen_timeout: 8000,
      kill_timeout: 5000,
    },
  ],
};
