module.exports = {
  apps: [
    {
      name: 'trend-quadros-api',
      script: 'dist/main.js',
      cwd: '/app',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        DB_HOST: 'localhost',
        DB_PORT: 5432,
        DB_NAME: 'dashboard',
        DB_USER: 'postgres',
        DB_PASSWORD: 'postgres123',
        TINY_API_TOKEN: 'a8dfc864f05313e7f9285f6bae3c000120a56c4ad596c62ec9b7ce62a7e9272b',
        JWT_SECRET: 'trend_quadros_jwt_secret_2024_super_secure_key',
        JWT_EXPIRES_IN: '24h',
        CORS_ORIGIN: 'https://v1.pontodeshboard.com,https://pontodeshboard.com,http://localhost:5173',
        AUTO_START_SYNC: 'true',
        SYNC_INTERVAL_MINUTES: '15',
        NODE_OPTIONS: '--openssl-legacy-provider'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      // Configurações de restart
      max_memory_restart: '1G',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Logs
      log_file: '/var/log/pm2/trend-quadros-api.log',
      out_file: '/var/log/pm2/trend-quadros-api-out.log',
      error_file: '/var/log/pm2/trend-quadros-api-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Configurações de monitoramento
      watch: false,
      ignore_watch: ['node_modules', 'logs'],
      
      // Configurações de cluster (se necessário)
      // instances: 'max',
      // exec_mode: 'cluster',
      
      // Configurações de health check
      health_check_grace_period: 3000,
      health_check_interval: 30000,
      
      // Configurações de timeout
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // Configurações de merge logs
      merge_logs: true,
      
      // Configurações de source map
      source_map_support: true,
      
      // Configurações de autorestart
      autorestart: true,
      
      // Configurações de cron (se necessário)
      // cron_restart: '0 0 * * *',
      
      // Configurações de variáveis de ambiente específicas
      env_file: '.env'
    }
  ],
  
  // Configurações de deploy (opcional)
  deploy: {
    production: {
      user: 'root',
      host: 'SEU_IP_DA_VPS',
      ref: 'origin/main',
      repo: 'git@github.com:SEU_USUARIO/trend-quadros-api.git',
      path: '/var/www/trend-quadros-api',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};




