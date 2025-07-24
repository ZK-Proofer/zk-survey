module.exports = {
  apps: [
    {
      name: "zk-survey-frontend",
      script: "yarn start -p 9112",
      instances: "1",
      exec_mode: "fork",
    },
  ],
};
