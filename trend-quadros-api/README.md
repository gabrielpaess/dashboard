# 🚀 Trend Quadros API

API NestJS para o sistema de dashboard da Trend Quadros.

## 📋 Funcionalidades

- **Sincronização com Tiny API**: Sincronização automática de pedidos a cada 15 minutos
- **Dashboard Data**: Endpoints para dados de vendas, produção e pós-venda
- **Autenticação JWT**: Sistema de autenticação seguro
- **Rate Limiting**: Proteção contra spam da Tiny API
- **Banco PostgreSQL**: Armazenamento de dados com migrações automáticas

## 🛠️ Tecnologias

- **NestJS**: Framework Node.js
- **TypeORM**: ORM para PostgreSQL
- **PostgreSQL**: Banco de dados
- **Docker**: Containerização
- **JWT**: Autenticação

## 🚀 Como Executar

### **Desenvolvimento**

```bash
# Instalar dependências
npm install

# Executar com Docker
docker-compose up --build -d

# Verificar logs
docker-compose logs -f api
```

### **Produção**

```bash
# Executar com Docker Compose de produção
docker-compose -f docker-compose.prod.yml up --build -d
```

## 🔧 Variáveis de Ambiente

```env
# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=dashboard
DB_USER=postgres
DB_PASSWORD=postgres123

# API
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://seu-dominio.com

# Tiny API
TINY_API_TOKEN=seu_token_aqui

# JWT
JWT_SECRET=seu_jwt_secret_aqui
JWT_EXPIRES_IN=24h

# Sync
AUTO_START_SYNC=true
SYNC_INTERVAL_MINUTES=15
```

## 📡 Endpoints

### **Dashboard**
- `GET /dashboard/overview` - Dados gerais do dashboard
- `GET /dashboard/sales` - Dados de vendas
- `GET /dashboard/production` - Dados de produção
- `GET /dashboard/after-sales` - Dados de pós-venda

### **Sincronização**
- `GET /sync/status` - Status da sincronização
- `POST /sync/start` - Iniciar sincronização
- `POST /sync/stop` - Parar sincronização
- `POST /sync/execute` - Executar sincronização manual

### **Pedidos**
- `GET /orders` - Listar pedidos
- `GET /orders/:id` - Obter pedido específico
- `GET /orders/notifications/15-day` - Pedidos para notificação de 15 dias
- `GET /orders/notifications/45-day` - Pedidos para notificação de 45 dias

## 🐳 Docker

### **Desenvolvimento**
```bash
docker-compose up --build -d
```

### **Produção**
```bash
docker-compose -f docker-compose.prod.yml up --build -d
```

## 📊 Monitoramento

- **Health Check**: `GET /health`
- **Logs**: `docker-compose logs -f api`
- **Status Sync**: `GET /sync/status`

## 🔄 Sincronização

A sincronização com a Tiny API acontece automaticamente a cada 15 minutos e inclui:

- Atualização de pedidos existentes
- Adição de novos pedidos
- Sincronização de itens dos pedidos
- Rate limiting para proteger a API

## 📝 Scripts Úteis

```bash
# Verificar configuração de sincronização
node check-sync-config.js

# Executar migrações
npm run migration:run

# Build para produção
npm run build
```

## 🌐 Deploy

### **Vercel**
1. Conectar repositório no Vercel
2. Configurar variáveis de ambiente
3. Deploy automático

### **Docker**
1. Build da imagem
2. Push para registry
3. Deploy em servidor

## 📞 Suporte

Para dúvidas ou problemas, abra uma issue no repositório.