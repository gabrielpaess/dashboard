# 🚀 Guia de Deploy em Produção - Trend Quadros API

## 📋 Pré-requisitos

- ✅ Arquivos do repositório na VPS
- ✅ `npm install` executado
- ✅ Banco de dados PostgreSQL criado
- ✅ Node.js instalado (versão 18+)
- ✅ PM2 instalado globalmente (recomendado)

## 🔧 Configuração do Ambiente

### 1. Configurar Variáveis de Ambiente

Crie o arquivo `.env` na raiz do projeto com as configurações de produção:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=trend_quadros_prod
DB_USER=seu_usuario_db
DB_PASSWORD=sua_senha_db

# API Configuration
PORT=3001
NODE_ENV=production

# JWT Configuration
JWT_SECRET=seu_jwt_secret_super_seguro_aqui
JWT_EXPIRES_IN=24h

# Tiny API Configuration
TINY_API_TOKEN=seu_token_da_tiny_api

# CORS Configuration
CORS_ORIGIN=https://seu-dominio.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Sync Configuration
AUTO_START_SYNC=true
RUN_INITIAL_SYNC=true
SYNC_INTERVAL_DEV=60000
SYNC_INTERVAL_PROD=900000
```

### 2. Instalar PM2 (Process Manager)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Verificar instalação
pm2 --version
```

## 🗄️ Executar Migrations

### 1. Executar Migrations de Produção

```bash
# Executar migrations
npm run migrate:prod

# Ou diretamente
NODE_ENV=production node scripts/migrate.js
```

### 2. Verificar se as Tabelas Foram Criadas

```bash
# Conectar ao banco e verificar tabelas
psql -h localhost -U seu_usuario -d trend_quadros_prod -c "\dt"
```

## 🏗️ Build e Inicialização

### 1. Compilar a Aplicação

```bash
# Compilar para produção
npm run build
```

### 2. Testar a API

```bash
# Testar conexão com Tiny API
npm run test:tiny

# Testar sincronização
npm run test:sync

# Executar sincronização inicial
npm run sync:initial
```

### 3. Iniciar em Produção

#### Opção 1: Com PM2 (Recomendado)

```bash
# Criar arquivo de configuração PM2
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'trend-quadros-api',
    script: 'dist/main.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF

# Criar diretório de logs
mkdir -p logs

# Iniciar com PM2
pm2 start ecosystem.config.js

# Verificar status
pm2 status

# Ver logs
pm2 logs trend-quadros-api
```

#### Opção 2: Diretamente com Node

```bash
# Iniciar diretamente
npm run start:prod
```

## 🔍 Verificação e Testes

### 1. Verificar se a API está Rodando

```bash
# Verificar se a porta está aberta
netstat -tlnp | grep :3001

# Testar endpoint de health
curl http://localhost:3001/health

# Testar endpoint de documentação
curl http://localhost:3001/api/docs
```

### 2. Testar Endpoints Principais

```bash
# Health check
curl -X GET http://localhost:3001/health

# Testar autenticação
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pontoquadros.com","password":"admin123"}'

# Testar sincronização
curl -X POST http://localhost:3001/api/sync/start

# Verificar status da sincronização
curl -X GET http://localhost:3001/api/sync/status
```

### 3. Verificar Logs

```bash
# Logs do PM2
pm2 logs trend-quadros-api

# Logs do sistema
tail -f /var/log/syslog | grep trend-quadros

# Verificar erros
pm2 logs trend-quadros-api --err
```

## 🔧 Configuração do Nginx (Opcional)

Se estiver usando Nginx como proxy reverso:

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🚀 Comandos Úteis para Produção

### Gerenciamento com PM2

```bash
# Parar aplicação
pm2 stop trend-quadros-api

# Reiniciar aplicação
pm2 restart trend-quadros-api

# Recarregar sem downtime
pm2 reload trend-quadros-api

# Ver status
pm2 status

# Ver logs em tempo real
pm2 logs trend-quadros-api --lines 100

# Monitorar recursos
pm2 monit

# Salvar configuração atual
pm2 save

# Configurar para iniciar no boot
pm2 startup
```

### Comandos de Sincronização

```bash
# Executar sincronização manual
npm run sync:initial

# Executar sincronização incremental
npm run sync:incremental

# Testar conexão com Tiny API
npm run test:tiny
```

## 🔍 Troubleshooting

### Problemas Comuns

1. **Erro de Conexão com Banco**:
   ```bash
   # Verificar se o PostgreSQL está rodando
   sudo systemctl status postgresql
   
   # Testar conexão
   psql -h localhost -U seu_usuario -d trend_quadros_prod
   ```

2. **Erro de Permissão**:
   ```bash
   # Dar permissões corretas
   chmod +x dist/main.js
   chown -R $USER:$USER .
   ```

3. **Porta em Uso**:
   ```bash
   # Verificar o que está usando a porta
   lsof -i :3001
   
   # Matar processo se necessário
   kill -9 PID_DO_PROCESSO
   ```

4. **Problemas de Memória**:
   ```bash
   # Verificar uso de memória
   free -h
   
   # Ajustar limite no PM2
   pm2 restart trend-quadros-api --max-memory-restart 2G
   ```

## 📊 Monitoramento

### Verificar Status da API

```bash
# Status geral
curl http://localhost:3001/health

# Status da sincronização
curl http://localhost:3001/api/sync/status

# Estatísticas do banco
curl http://localhost:3001/api/dashboard/stats
```

### Logs Importantes

```bash
# Logs de erro
pm2 logs trend-quadros-api --err --lines 50

# Logs de sincronização
pm2 logs trend-quadros-api | grep -i sync

# Logs de autenticação
pm2 logs trend-quadros-api | grep -i auth
```

## ✅ Checklist de Deploy

- [ ] ✅ Arquivos copiados para VPS
- [ ] ✅ `npm install` executado
- [ ] ✅ Banco de dados criado
- [ ] ✅ Arquivo `.env` configurado
- [ ] ✅ PM2 instalado
- [ ] ✅ Migrations executadas
- [ ] ✅ Aplicação compilada (`npm run build`)
- [ ] ✅ Testes de conexão executados
- [ ] ✅ API iniciada com PM2
- [ ] ✅ Health check funcionando
- [ ] ✅ Sincronização inicial executada
- [ ] ✅ Logs sendo gerados corretamente

## 🎉 Próximos Passos

Após o deploy bem-sucedido:

1. **Configurar SSL** (se necessário)
2. **Configurar backup automático** do banco
3. **Configurar monitoramento** (opcional)
4. **Configurar alertas** de erro
5. **Documentar** credenciais e configurações

---

**📞 Suporte**: Em caso de problemas, verifique os logs e execute os comandos de troubleshooting listados acima.
