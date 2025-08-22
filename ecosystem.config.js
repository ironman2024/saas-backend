module.exports = {
  apps: [{
    name: 'saas-base-api',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    // Logging
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Auto restart
    watch: false,
    ignore_watch: ['node_modules', 'logs'],
    max_memory_restart: '1G',
    
    // Advanced features
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    
    // Health monitoring
    max_restarts: 10,
    min_uptime: '10s',
    
    // Environment specific settings
    node_args: '--max-old-space-size=1024'
  }],

  deploy: {
    production: {
      user: 'ubuntu',
      host: process.env.PRODUCTION_HOST || 'your-server-ip',
      ref: 'origin/main',
      repo: 'https://github.com/your-username/saas-base.git',
      path: '/var/www/saas-base',
      'pre-deploy-local': '',
      'post-deploy': 'cd backend && npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};