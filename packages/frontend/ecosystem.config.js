module.exports = {
  apps: [
    {
      name: "zk-survey-frontend",
      script: "yarn start",
      instances: "1",
      exec_mode: "fork",
    },
  ],
};
