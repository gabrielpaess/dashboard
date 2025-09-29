# 🌐 Acessar API Diretamente pelo IP (Sem Nginx)

## ✅ Sim, é possível acessar sem Nginx!

Você pode acessar a API diretamente pelo IP `168.231.90.41` na porta `3001`.

## 🔧 Configurações Necessárias

### 1. Verificar se a API está rodando

```bash
# Verificar status do PM2
pm2 status

# Verificar se a porta 3001 está aberta
netstat -tlnp | grep :3001

# Ver logs da aplicação
pm2 logs trend-quadros-api
```

### 2. Configurar Firewall (Ubuntu/Debian)

```bash
# Abrir porta 3001 no firewall
sudo ufw allow 3001

# Verificar status do firewall
sudo ufw status

# Se estiver ativo, verificar regras
sudo ufw status numbered
```

### 3. Configurar CORS para aceitar requisições do frontend

Edite o arquivo `.env` na VPS:

```env
# CORS Configuration - IMPORTANTE!
CORS_ORIGIN=http://localhost:5173,http://168.231.90.41:5173,http://localhost:3000

# API Configuration
NODE_ENV=production
PORT=3001
HOST=0.0.0.0  # IMPORTANTE: Aceitar conexões de qualquer IP
```

### 4. Reiniciar a aplicação

```bash
# Reiniciar com novas configurações
pm2 restart trend-quadros-api

# Verificar se está rodando
pm2 status
```

## 🌐 URLs de Acesso

### API Endpoints

- **Health Check**: `http://168.231.90.41:3001/health`
- **Documentação**: `http://168.231.90.41:3001/api/docs`
- **Autenticação**: `http://168.231.90.41:3001/api/auth`
- **Pedidos**: `http://168.231.90.41:3001/api/orders`
- **Sincronização**: `http://168.231.90.41:3001/api/sync`

### Testar no Navegador

Abra no navegador:
```
http://168.231.90.41:3001/health
```

Deve retornar:
```json
{
  "status": "ok",
  "timestamp": "2024-01-XX...",
  "uptime": 123.456
}
```

## 🔧 Configuração do Frontend

### 1. Atualizar URL da API no frontend

No arquivo de configuração do frontend (geralmente `src/config/environment.js` ou similar):

```javascript
// Configuração para produção
const API_BASE_URL = 'http://168.231.90.41:3001/api';

// Ou usar variável de ambiente
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'http://168.231.90.41:3001/api'
  : 'http://localhost:3001/api';
```

### 2. Exemplo de requisição do frontend

```javascript
// Exemplo de login
const login = async (email, password) => {
  const response = await fetch('http://168.231.90.41:3001/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password })
  });
  
  return response.json();
};

// Exemplo de buscar pedidos
const getOrders = async (token) => {
  const response = await fetch('http://168.231.90.41:3001/api/orders', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return response.json();
};
```

## 🧪 Testar Requisições

### 1. Teste com curl

```bash
# Health check
curl http://168.231.90.41:3001/health

# Teste de login
curl -X POST http://168.231.90.41:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pontoquadros.com","password":"admin123"}'

# Teste de pedidos (com token)
curl http://168.231.90.41:3001/api/orders \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### 2. Teste com Postman/Insomnia

- **URL**: `http://168.231.90.41:3001`
- **Método**: GET
- **Endpoint**: `/health`

## 🔒 Configurações de Segurança

### 1. Configurar CORS corretamente

No arquivo `.env` da VPS:

```env
# CORS - Permitir apenas IPs específicos
CORS_ORIGIN=http://localhost:5173,http://168.231.90.41:5173,http://seu-dominio.com

# Host - Aceitar conexões de qualquer IP
HOST=0.0.0.0
PORT=3001
```

### 2. Configurar firewall restritivo

```bash
# Permitir apenas porta 3001
sudo ufw allow 3001/tcp

# Bloquear outras portas se necessário
sudo ufw deny 22  # Se não usar SSH
```

## 🚀 Deploy do Frontend

### 1. Build do frontend

```bash
# No seu computador local
cd trend-quadros-dashboard
npm run build
```

### 2. Servir o frontend

**Opção A: Servidor simples (Node.js)**
```bash
# Instalar servidor simples
npm install -g serve

# Servir o build
serve -s dist -l 5173
```

**Opção B: Nginx (recomendado para produção)**
```nginx
server {
    listen 80;
    server_name 168.231.90.41;
    
    location / {
        root /caminho/para/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
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

## 🔍 Troubleshooting

### 1. API não acessível

```bash
# Verificar se está rodando
pm2 status

# Verificar porta
netstat -tlnp | grep :3001

# Verificar firewall
sudo ufw status

# Verificar logs
pm2 logs trend-quadros-api
```

### 2. CORS Error no frontend

- Verificar se `CORS_ORIGIN` está configurado corretamente
- Verificar se o frontend está fazendo requisições para o IP correto
- Verificar se o protocolo (http/https) está correto

### 3. Conexão recusada

```bash
# Verificar se a aplicação está ouvindo em 0.0.0.0
netstat -tlnp | grep :3001

# Deve mostrar: 0.0.0.0:3001
# Se mostrar 127.0.0.1:3001, configurar HOST=0.0.0.0
```

## ✅ Checklist de Configuração

- [ ] ✅ API rodando no PM2
- [ ] ✅ Porta 3001 aberta no firewall
- [ ] ✅ CORS configurado para aceitar requisições do frontend
- [ ] ✅ HOST=0.0.0.0 no .env
- [ ] ✅ Frontend configurado para usar IP da VPS
- [ ] ✅ Teste de health check funcionando
- [ ] ✅ Teste de login funcionando

## 🎯 URLs Finais

- **API**: `http://168.231.90.41:3001`
- **Frontend**: `http://168.231.90.41:5173` (ou porta que escolher)
- **Documentação**: `http://168.231.90.41:3001/api/docs`

---

**💡 Dica**: Para produção, recomendo configurar Nginx posteriormente para melhor performance e segurança, mas para testes e desenvolvimento, o acesso direto funciona perfeitamente!
