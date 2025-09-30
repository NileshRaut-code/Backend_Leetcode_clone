module.exports = {
  apps: [
    {
      name: 'server',
      script: 'src/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        REDIS_URL: 'redis://localhost:6379',
        CORS_ORIGIN: 'http://localhost:3001'
      },
    },
    {
      name: 'worker-js',
      script: 'worker.js',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        REDIS_URL: 'redis://localhost:6379'
      },
    },
    {
      name: 'worker-cpp',
      script: 'workercpp.js',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        REDIS_URL: 'redis://localhost:6379'
      },
    },
  ],
};