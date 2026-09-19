module.exports = {
  apps: [{
    name: 'mut-study-hub-api',
    script: './server.js',
    
    // Cluster mode - use all CPU cores
    instances: 'max', // Or specify a number like 4
    exec_mode: 'cluster',
    
    // Environment variables
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    env_development: {
      NODE_ENV: 'development',
      PORT: 5000
    },
    
    // Performance & Reliability
    max_memory_restart: '1G', // Restart if memory exceeds 1GB
    min_uptime: '10s', // Minimum uptime before considering app stable
    max_restarts: 10, // Max restarts within unstable_restarts window
    autorestart: true, // Auto-restart on crash
    watch: false, // Don't watch files in production
    ignore_watch: ['node_modules', 'logs', 'uploads'],
    
    // Logging
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true, // Prefix logs with timestamp
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true, // Merge logs from all instances
    
    // Graceful shutdown/reload
    kill_timeout: 5000, // Wait 5s before force kill
    wait_ready: true, // Wait for ready signal before considering started
    listen_timeout: 10000, // Max time to wait for listen
    
    // Exponential backoff restart delay
    exp_backoff_restart_delay: 100,
    
    // Health monitoring
    // Uncomment if you have @pm2/io installed
    // pmx: true,
    // instances_auto_restart: true,
    
    // Node.js args for optimization
    node_args: [
      '--max-old-space-size=2048', // 2GB heap size
      '--max-http-header-size=16384' // 16KB header size
    ]
  }],

  // Deployment configuration
  deploy: {
    production: {
      user: 'deploy',
      host: ['your-server-ip'],
      ref: 'origin/main',
      repo: 'https://github.com/yourusername/mut-study-hub.git',
      path: '/var/www/mut-study-hub',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-deploy-local': 'git push origin main'
    },
    staging: {
      user: 'deploy',
      host: ['your-staging-server-ip'],
      ref: 'origin/develop',
      repo: 'https://github.com/yourusername/mut-study-hub.git',
      path: '/var/www/mut-study-hub-staging',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env staging'
    }
  }
};
