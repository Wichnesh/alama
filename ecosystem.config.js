module.exports = {
  apps : [{
    name: 'ALAMA api',
    script: 'node app.js',
    watch: true,
    ignore_watch: ["node_modules", "logs", "public"],
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
