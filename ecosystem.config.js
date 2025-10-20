module.exports = {
  apps: [{
    name: 'ailydian-ultra-pro',
    script: 'server.js',
    cwd: '/Users/sardag/Desktop/ailydian-ultra-pro',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'development',
      PORT: 3100
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3100
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    kill_timeout: 5000
  }]
};
