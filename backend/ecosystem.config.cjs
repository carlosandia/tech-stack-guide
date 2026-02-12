module.exports = {
  apps: [{
    name: 'crm-backend',
    script: 'node_modules/.bin/tsx',
    args: 'src/index.ts',
    cwd: '/var/www/crm.renovedigital.com.br/backend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/var/www/crm.renovedigital.com.br/logs/pm2-error.log',
    out_file: '/var/www/crm.renovedigital.com.br/logs/pm2-out.log',
    log_file: '/var/www/crm.renovedigital.com.br/logs/pm2-combined.log',
    time: true
  }]
};
