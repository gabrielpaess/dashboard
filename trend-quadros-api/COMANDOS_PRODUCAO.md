# 🚀 Comandos para Deploy em Produção - Trend Quadros API

## 📋 Passo a Passo para Deploy

### 1. Configurar Ambiente

```bash
# 1. Copiar arquivo de configuração
cp env.example .env

# 2. Editar configurações de produção
nano .env
```

**Configurações importantes no .env:**
```env
NODE_ENV=production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=trend_quadros_prod
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
TINY_API_TOKEN=seu_token_da_tiny
JWT_SECRET=seu_jwt_secret_super_seguro
CORS_ORIGIN=https://seu-dominio.com
AUTO_START_SYNC=true
RUN_INITIAL_SYNC=true
```

### 2. Instalar Dependências e Compilar

```bash
# Instalar dependências
npm install

# Compilar para produção
npm run build
```

### 3. Executar Migrations

```bash
# Executar migrations de produção
npm run migrate:prod

# Verificar se as tabelas foram criadas
psql -h localhost -U seu_usuario -d trend_quadros_prod -c "\dt"
```

### 4. Testar Conexões

```bash
# Testar conexão com Tiny API
npm run test:tiny

# Testar sincronização
npm run test:sync
```

### 5. Instalar PM2 (Process Manager)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Verificar instalação
pm2 --version
```

### 6. Iniciar Aplicação

```bash
# Opção 1: Iniciar diretamente
npm run start:prod

# Opção 2: Com PM2 (recomendado)
pm2 start dist/main.js --name "trend-quadros-api" --env production

# Opção 3: Com arquivo de configuração PM2
# (Criar ecosystem.config.js conforme documentação)
pm2 start ecosystem.config.js
```

### 7. Executar Sincronização Inicial

```bash
# Executar sincronização inicial completa
npm run sync:initial
```

## 🔍 Comandos de Verificação

### Verificar Status da Aplicação

```bash
# Verificar se está rodando
pm2 status

# Ver logs
pm2 logs trend-quadros-api

# Ver logs de erro
pm2 logs trend-quadros-api --err

# Monitorar recursos
pm2 monit
```

### Testar Endpoints

```bash
# Health check
curl http://localhost:3001/health

# Documentação da API
curl http://localhost:3001/api/docs

# Status da sincronização
curl http://localhost:3001/api/sync/status

# Testar autenticação
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pontoquadros.com","password":"admin123"}'
```

### Verificar Banco de Dados

```bash
# Conectar ao banco
psql -h localhost -U seu_usuario -d trend_quadros_prod

# Verificar tabelas
\dt

# Contar pedidos
SELECT COUNT(*) FROM pedidos;

# Ver pedidos recentes
SELECT pedido_id, nome_cliente, situacao, created_at 
FROM pedidos 
ORDER BY created_at DESC 
LIMIT 10;
```

## 🛠️ Comandos de Manutenção

### Gerenciar Aplicação

```bash
# Parar aplicação
pm2 stop trend-quadros-api

# Reiniciar aplicação
pm2 restart trend-quadros-api

# Recarregar sem downtime
pm2 reload trend-quadros-api

# Parar e remover
pm2 delete trend-quadros-api
```

### Sincronização

```bash
# Sincronização inicial completa
npm run sync:initial

# Sincronização incremental
npm run sync:incremental

# Testar conexão Tiny API
npm run test:tiny
```

### Logs e Monitoramento

```bash
# Ver logs em tempo real
pm2 logs trend-quadros-api --lines 50

# Ver apenas erros
pm2 logs trend-quadros-api --err --lines 20

# Limpar logs
pm2 flush

# Salvar configuração PM2
pm2 save

# Configurar para iniciar no boot
pm2 startup
```

## 🔧 Troubleshooting

### Problemas Comuns

1. **Aplicação não inicia:**
   ```bash
   # Verificar logs
   pm2 logs trend-quadros-api
   
   # Verificar se a porta está em uso
   netstat -tlnp | grep :3001
   
   # Matar processo na porta
   kill -9 $(lsof -t -i:3001)
   ```

2. **Erro de banco de dados:**
   ```bash
   # Verificar se PostgreSQL está rodando
   sudo systemctl status postgresql
   
   # Testar conexão
   psql -h localhost -U seu_usuario -d trend_quadros_prod
   ```

3. **Erro de memória:**
   ```bash
   # Verificar uso de memória
   free -h
   
   # Ajustar limite no PM2
   pm2 restart trend-quadros-api --max-memory-restart 2G
   ```

4. **Sincronização falha:**
   ```bash
   # Verificar token da Tiny API
   npm run test:tiny
   
   # Executar sincronização manual
   npm run sync:initial
   ```

## 📊 Monitoramento Contínuo

### Script de Verificação Automática

```bash
#!/bin/bash
# Criar arquivo check-api.sh

# Verificar se aplicação está rodando
if ! pm2 list | grep -q "trend-quadros-api.*online"; then
    echo "❌ API não está rodando!"
    pm2 restart trend-quadros-api
fi

# Verificar health check
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo "❌ Health check falhou!"
    pm2 restart trend-quadros-api
fi

echo "✅ API funcionando normalmente"
```

### Configurar Cron para Verificação

```bash
# Editar crontab
crontab -e

# Adicionar verificação a cada 5 minutos
*/5 * * * * /caminho/para/check-api.sh
```

## 🎯 Checklist Final

- [ ] ✅ Arquivos copiados para VPS
- [ ] ✅ `npm install` executado
- [ ] ✅ Banco de dados criado
- [ ] ✅ Arquivo `.env` configurado
- [ ] ✅ `npm run build` executado
- [ ] ✅ `npm run migrate:prod` executado
- [ ] ✅ PM2 instalado
- [ ] ✅ Aplicação iniciada com PM2
- [ ] ✅ `npm run test:tiny` executado
- [ ] ✅ `npm run sync:initial` executado
- [ ] ✅ Health check funcionando
- [ ] ✅ Logs sendo gerados

## 🎉 Próximos Passos

1. **Configurar Nginx** (proxy reverso)
2. **Configurar SSL** (HTTPS)
3. **Configurar backup** do banco
4. **Configurar monitoramento** (opcional)
5. **Configurar alertas** de erro

---

**📞 Suporte**: Em caso de problemas, execute os comandos de troubleshooting e verifique os logs.
