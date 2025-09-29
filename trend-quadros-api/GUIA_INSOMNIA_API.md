# 🚀 Guia Completo - Testando API no Insomnia

## 📋 **Informações da API**
- **Base URL:** `http://168.231.90.41:3001`
- **Porta:** `3001`
- **Autenticação:** JWT Bearer Token
- **Formato:** JSON

---

## 🔐 **1. AUTENTICAÇÃO (Login)**

### **1.1 Login de Usuário**
```http
POST http://168.231.90.41:3001/api/auth/login
Content-Type: application/json

{
  "email": "admin@pontoquadros.com",
  "password": "admin123"
}
```

**Resposta Esperada:**
```json
{
  "success": true,
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@pontoquadros.com",
    "nome": "Administrador",
    "nivel": "admin"
  }
}
```

### **1.2 Registrar Novo Usuário**
```http
POST http://168.231.90.41:3001/api/auth/register
Content-Type: application/json

{
  "email": "usuario@exemplo.com",
  "password": "senha123",
  "nome": "Nome do Usuário",
  "nivel": "user"
}
```

### **1.3 Verificar Perfil (Requer Token)**
```http
GET http://168.231.90.41:3001/api/auth/me
Authorization: Bearer SEU_TOKEN_AQUI
```

---

## 📦 **2. PEDIDOS (Orders)**

### **2.1 Listar Todos os Pedidos**
```http
GET http://168.231.90.41:3001/api/orders
Authorization: Bearer SEU_TOKEN_AQUI
```

### **2.2 Listar Pedidos com Filtros**
```http
GET http://168.231.90.41:3001/api/orders?dataInicial=2024-01-01&dataFinal=2024-12-31&situacao=Entregue
Authorization: Bearer SEU_TOKEN_AQUI
```

**Parâmetros de Query Disponíveis:**
- `dataInicial` - Data inicial (YYYY-MM-DD)
- `dataFinal` - Data final (YYYY-MM-DD)
- `situacao` - Situação do pedido (Entregue, Pendente, Cancelado, etc.)
- `nome_vendedor` - Nome do vendedor
- `cliente` - Nome do cliente
- `page` - Página (para paginação)
- `limit` - Limite por página

### **2.3 Obter Pedido por ID**
```http
GET http://168.231.90.41:3001/api/orders/123
Authorization: Bearer SEU_TOKEN_AQUI
```

### **2.4 Criar Novo Pedido**
```http
POST http://168.231.90.41:3001/api/orders
Authorization: Bearer SEU_TOKEN_AQUI
Content-Type: application/json

{
  "pedido_id": "PED-2024-001",
  "cliente": "Cliente Exemplo",
  "valor_total": 1500.00,
  "situacao": "Pendente",
  "data_pedido": "2024-01-15",
  "data_prevista": "2024-01-30",
  "nome_vendedor": "João Silva"
}
```

### **2.5 Atualizar Pedido**
```http
PATCH http://168.231.90.41:3001/api/orders/123
Authorization: Bearer SEU_TOKEN_AQUI
Content-Type: application/json

{
  "situacao": "Entregue",
  "data_entrega": "2024-01-25"
}
```

### **2.6 Deletar Pedido**
```http
DELETE http://168.231.90.41:3001/api/orders/123
Authorization: Bearer SEU_TOKEN_AQUI
```

---

## 📊 **3. DASHBOARD (Dados Gerais)**

### **3.1 Visão Geral (Overview)**
```http
GET http://168.231.90.41:3001/api/dashboard/overview
```

**Com Filtros de Data:**
```http
GET http://168.231.90.41:3001/api/dashboard/overview?dataInicial=2024-01-01&dataFinal=2024-12-31
```

### **3.2 Dados de Vendas**
```http
GET http://168.231.90.41:3001/api/dashboard/sales
```

### **3.3 Dados de Produção**
```http
GET http://168.231.90.41:3001/api/dashboard/production
```

### **3.4 Dados de Pós-Venda**
```http
GET http://168.231.90.41:3001/api/dashboard/after-sales
```

---

## 🔔 **4. NOTIFICAÇÕES**

### **4.1 Pedidos para Notificação de 15 Dias**
```http
GET http://168.231.90.41:3001/api/orders/notifications/15-day
Authorization: Bearer SEU_TOKEN_AQUI
```

### **4.2 Pedidos para Notificação de 45 Dias**
```http
GET http://168.231.90.41:3001/api/orders/notifications/45-day
Authorization: Bearer SEU_TOKEN_AQUI
```

### **4.3 Atualizar Status de Notificação**
```http
PATCH http://168.231.90.41:3001/api/orders/123/notifications
Authorization: Bearer SEU_TOKEN_AQUI
Content-Type: application/json

{
  "envio_15": true,
  "envio_45": false
}
```

---

## 📈 **5. ESTATÍSTICAS**

### **5.1 Estatísticas do Dashboard**
```http
GET http://168.231.90.41:3001/api/orders/stats/dashboard
Authorization: Bearer SEU_TOKEN_AQUI
```

**Com Filtros:**
```http
GET http://168.231.90.41:3001/api/orders/stats/dashboard?dataInicial=2024-01-01&dataFinal=2024-12-31
Authorization: Bearer SEU_TOKEN_AQUI
```

---

## 🏥 **6. HEALTH CHECK**

### **6.1 Verificar Status da API**
```http
GET http://168.231.90.41:3001/health
```

**Resposta Esperada:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600
}
```

---

## 🔧 **7. CONFIGURAÇÃO NO INSOMNIA**

### **7.1 Configurar Environment**
1. **Criar Environment:** `Trend Quadros API`
2. **Adicionar Variáveis:**
   - `base_url`: `http://168.231.90.41:3001`
   - `api_url`: `http://168.231.90.41:3001/api`
   - `token`: (será preenchido após login)

### **7.2 Configurar Headers Globais**
```json
{
  "Content-Type": "application/json",
  "Accept": "application/json"
}
```

### **7.3 Configurar Auth Bearer Token**
1. **Selecionar:** `Auth` → `Bearer Token`
2. **Token:** `{{ _.token }}` (usar variável do environment)

---

## 📝 **8. EXEMPLOS DE RESPOSTAS**

### **8.1 Resposta de Sucesso Padrão**
```json
{
  "success": true,
  "data": {
    // dados específicos da requisição
  },
  "message": "Operação realizada com sucesso"
}
```

### **8.2 Resposta de Erro Padrão**
```json
{
  "success": false,
  "error": "Mensagem de erro",
  "statusCode": 400
}
```

### **8.3 Resposta de Lista de Pedidos**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "pedido_id": "PED-2024-001",
      "cliente": "Cliente Exemplo",
      "valor_total": 1500.00,
      "situacao": "Entregue",
      "data_pedido": "2024-01-15",
      "data_prevista": "2024-01-30",
      "nome_vendedor": "João Silva",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-25T14:20:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

---

## 🚨 **9. CÓDIGOS DE STATUS HTTP**

- **200** - Sucesso
- **201** - Criado com sucesso
- **400** - Requisição inválida
- **401** - Não autorizado (token inválido/expirado)
- **403** - Acesso negado
- **404** - Recurso não encontrado
- **409** - Conflito (ex: email já existe)
- **500** - Erro interno do servidor

---

## 🔍 **10. TROUBLESHOOTING**

### **10.1 Erro de Conexão**
- ✅ Verificar se a API está rodando: `pm2 status`
- ✅ Verificar se a porta 3001 está aberta
- ✅ Testar: `curl http://168.231.90.41:3001/health`

### **10.2 Erro 401 (Não Autorizado)**
- ✅ Verificar se o token está correto
- ✅ Verificar se o token não expirou
- ✅ Fazer login novamente para obter novo token

### **10.3 Erro 404 (Não Encontrado)**
- ✅ Verificar se a URL está correta
- ✅ Verificar se o endpoint existe
- ✅ Verificar se o ID do recurso existe

---

## 📚 **11. ORDEM RECOMENDADA DE TESTES**

1. **Health Check** - Verificar se API está funcionando
2. **Login** - Obter token de autenticação
3. **Dashboard Overview** - Ver dados gerais (não requer auth)
4. **Listar Pedidos** - Ver todos os pedidos
5. **Filtrar Pedidos** - Testar filtros
6. **Obter Pedido Específico** - Por ID
7. **Dashboard Sales** - Dados de vendas
8. **Notificações** - Testar sistema de notificações

---

**🎯 Pronto para testar! Use este guia para explorar todas as funcionalidades da API.**
