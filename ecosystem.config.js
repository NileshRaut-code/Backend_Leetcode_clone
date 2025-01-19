module.exports = {
    apps: [
      {
        name: "server",
        script: "src/server.js",
      },
      {
        name: "worker",
        script: "worker.js",
      },
      {
        name: "workercpp",
        script: "workercpp.js",
      },
    ],
  };
  