# 🗄️ Configuração do Banco de Dados - meus_pedidos

## ✅ Banco Criado

Você já criou o banco com as seguintes configurações:
- **Database**: `meus_pedidos`
- **User**: `api_user`
- **Password**: `Pontoplacas25-`

## 🔧 Configuração Necessária

### 1. Criar arquivo .env

```bash
# Copiar arquivo de exemplo
cp env.production.example .env

# Editar com suas configurações
nano .env
```

### 2. Configuração do .env

O arquivo `.env` deve conter:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=meus_pedidos
DB_USER=api_user
DB_PASSWORD=Pontoplacas25-

# API Configuration
NODE_ENV=production
PORT=3001

# JWT Configuration
JWT_SECRET=trend_quadros_jwt_secret_2024_super_secure_key_production
JWT_EXPIRES_IN=24h

# Tiny API Configuration
TINY_API_TOKEN=seu_token_da_tiny_api_aqui

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Sync Configuration
AUTO_START_SYNC=true
RUN_INITIAL_SYNC=true
```

## 🧪 Testar Configuração

### 1. Testar conexão com banco

```bash
# Testar conexão específica
npm run test:db
```

Este comando irá:
- Testar conexão com `meus_pedidos`
- Verificar permissões do usuário `api_user`
- Listar tabelas existentes

### 2. Debug das variáveis

```bash
# Verificar se as variáveis estão carregadas
npm run debug:env
```

### 3. Executar migrations

```bash
# Executar migrations no banco meus_pedidos
npm run migrate:prod
```

## 🔍 Verificação Manual

### Conectar diretamente ao banco

```bash
# Conectar com psql
psql -h localhost -U api_user -d meus_pedidos

# Testar query
SELECT current_database(), current_user;

# Ver tabelas
\dt

# Sair
\q
```

### Verificar permissões

```bash
# Conectar como superuser
sudo -u postgres psql

# Verificar usuário
\du api_user

# Verificar banco
\l meus_pedidos

# Sair
\q
```

## 🚀 Sequência de Deploy

Execute na ordem:

```bash
# 1. Criar arquivo .env
cp env.production.example .env
nano .env  # Editar com suas configurações

# 2. Testar conexão
npm run test:db

# 3. Executar migrations
npm run migrate:prod

# 4. Testar sincronização
npm run test:sync

# 5. Executar sincronização inicial
npm run sync:initial

# 6. Compilar e iniciar
npm run build
npm run start:prod
```

## ❓ Problemas Comuns

### 1. "database does not exist"

**Solução**: Verificar se o nome do banco está correto no .env
```bash
# Verificar configuração
npm run debug:env
```

### 2. "authentication failed"

**Solução**: Verificar usuário e senha
```bash
# Testar conexão manual
psql -h localhost -U api_user -d meus_pedidos
```

### 3. "permission denied"

**Solução**: Verificar permissões do usuário
```bash
# Conectar como superuser e dar permissões
sudo -u postgres psql
GRANT ALL PRIVILEGES ON DATABASE meus_pedidos TO api_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO api_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO api_user;
\q
```

## 📊 Verificar Status

### Verificar se está funcionando

```bash
# Status da conexão
npm run test:db

# Verificar tabelas criadas
psql -h localhost -U api_user -d meus_pedidos -c "\dt"

# Contar pedidos (após sincronização)
psql -h localhost -U api_user -d meus_pedidos -c "SELECT COUNT(*) FROM pedidos;"
```

## 🎯 Próximos Passos

Após configurar o banco:

1. ✅ Configurar arquivo .env
2. ✅ Testar conexão (`npm run test:db`)
3. ✅ Executar migrations (`npm run migrate:prod`)
4. ✅ Testar sincronização (`npm run test:sync`)
5. ✅ Executar sincronização inicial (`npm run sync:initial`)
6. ✅ Iniciar aplicação (`npm run start:prod`)

---

**💡 Dica**: Sempre execute `npm run test:db` primeiro para verificar se a conexão está funcionando antes de executar outros comandos.
