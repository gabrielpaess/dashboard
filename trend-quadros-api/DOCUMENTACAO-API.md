# Documentação da API – Trend Quadros Dashboard

**Data da análise:** 11/03/2025  
**Projeto:** trend-quadros-api (NestJS)

---

## 1. Status da API

| Item | Status |
|------|--------|
| **API rodando localmente** | Não (health check em `http://localhost:3001/health` sem resposta) |
| **Porta padrão** | 3001 |
| **Prefixo global** | `/api` |
| **Documentação Swagger** | `http://<host>:<porta>/api/docs` |
| **Health check** | `http://<host>:<porta>/health` (sem prefixo `/api`) |

### Como subir a API

```bash
# Desenvolvimento (watch)
npm run start:dev

# Produção (após build)
npm run build
npm run start:prod
```

Variáveis de ambiente necessárias (`.env`): `DB_*`, `JWT_SECRET`, opcionalmente `PORT`, `NODE_ENV`, `SSL_*`, `CORS_ORIGIN`.

---

## 2. Acesso e Login

### 2.1 URL de login

- **Método:** `POST`
- **URL:** `http://<host>:<porta>/api/auth/login`
- **Exemplo local:** `http://localhost:3001/api/auth/login`

### 2.2 Corpo da requisição (JSON)

| Campo   | Tipo   | Obrigatório | Descrição        |
|---------|--------|-------------|------------------|
| `email` | string | Sim         | Email do usuário |
| `password` | string | Sim      | Senha (mínimo 6 caracteres) |

**Exemplo:**

```json
{
  "email": "admin@pontoquadros.com",
  "password": "sua_senha"
}
```

### 2.3 Resposta de sucesso (200)

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "nome": "Nome do Usuário",
    "email": "admin@pontoquadros.com",
    "nivel": "admin"
  }
}
```

### 2.4 Resposta de erro (401)

- **Credenciais inválidas:** `"Email ou senha inválidos"`
- Usuário inativo não consegue fazer login.

### 2.5 Uso do token (rotas protegidas)

Enviar o token no header:

```
Authorization: Bearer <access_token>
```

Exemplo com cURL:

```bash
curl -X GET "http://localhost:3001/api/auth/me" -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

---

## 3. Endpoints de autenticação (resumo)

| Método | Endpoint | Autenticação | Descrição |
|--------|----------|--------------|-----------|
| POST   | `/api/auth/login` | Pública | Login |
| POST   | `/api/auth/register` | Pública | Registrar usuário |
| GET    | `/api/auth/me` | Bearer | Perfil do usuário logado |
| GET    | `/api/auth/users` | Bearer | Listar usuários |
| PUT    | `/api/auth/users/:id` | Bearer | Atualizar usuário |
| POST   | `/api/auth/change-password` | Bearer | Alterar senha |
| GET    | `/api/auth/check-access/:tab` | Bearer | Verificar acesso à aba |

**Níveis de usuário:** `admin`, `vendas`, `desenvolvimento`, `producao`, `after-sales`.

---

## 4. Estrutura do banco de dados

Banco: **PostgreSQL**. Configuração via `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (default: `dashboard`).

### 4.1 Tabela: `usuarios`

Usuários do sistema (login, níveis, metas).

| Coluna       | Tipo           | Restrições | Descrição |
|-------------|----------------|------------|-----------|
| `id`        | SERIAL (PK)    | —          | ID interno |
| `email`     | VARCHAR(255)   | UNIQUE     | Email (login) |
| `senha_hash`| VARCHAR(255)   | NOT NULL   | Senha (bcrypt) |
| `nivel`     | VARCHAR(50)    | NOT NULL   | Nível de acesso |
| `nome`      | VARCHAR(255)   | NOT NULL   | Nome |
| `ativo`     | BOOLEAN        | DEFAULT true | Usuário ativo |
| `created_at`| TIMESTAMP      | —          | Criação |
| `updated_at`| TIMESTAMP      | —          | Atualização |

**Relação:** 1 usuário → N `sales_goals` (metas de vendas).

---

### 4.2 Tabela: `pedidos`

Pedidos sincronizados para o dashboard.

| Coluna          | Tipo            | Restrições | Descrição |
|-----------------|-----------------|------------|-----------|
| `id`            | SERIAL (PK)     | —          | ID interno |
| `pedido_id`     | VARCHAR(255)     | UNIQUE     | ID externo do pedido |
| `numero`        | VARCHAR(255)     | nullable   | Número do pedido |
| `nome_cliente`  | VARCHAR(255)     | nullable   | Nome do cliente |
| `data_pedido`   | DATE             | nullable   | Data do pedido |
| `data_pedido_pt_br` | VARCHAR(255) | nullable   | Data em formato PT-BR |
| `data_prevista` | VARCHAR(255)     | nullable   | Data prevista |
| `situacao`      | VARCHAR(255)     | nullable   | Situação do pedido |
| `valor_total`   | DECIMAL(10,2)    | nullable   | Valor total |
| `nome_vendedor` | VARCHAR(255)     | nullable   | Nome do vendedor |
| `itens_json`    | JSONB            | nullable   | Itens do pedido (JSON) |
| `envio_15`      | BOOLEAN          | DEFAULT false | Notificação 15 dias |
| `envio_45`      | BOOLEAN          | DEFAULT false | Notificação 45 dias |
| `created_at`    | TIMESTAMP        | —          | Criação |
| `updated_at`    | TIMESTAMP        | —          | Atualização |

**Índices:** `pedido_id` (unique), `situacao`, `data_pedido`.

---

### 4.3 Tabela: `sales_goals`

Metas de vendas (diária, semanal, mensal).

| Coluna       | Tipo            | Restrições | Descrição |
|--------------|-----------------|------------|-----------|
| `id`         | UUID (PK)       | —          | ID da meta |
| `daily_goal` | DECIMAL(15,2)   | DEFAULT 7000.00 | Meta diária |
| `weekly_goal`| DECIMAL(15,2)   | DEFAULT 45000.00 | Meta semanal |
| `monthly_goal`| DECIMAL(15,2)  | DEFAULT 200000.00 | Meta mensal |
| `created_by` | INT             | nullable, FK → usuarios.id | Quem criou |
| `created_at` | TIMESTAMP       | —          | Criação |
| `updated_at` | TIMESTAMP       | —          | Atualização |

**Relação:** N `sales_goals` → 1 `usuarios` (created_by).

---

## 5. Diagrama de relações (resumo)

```
usuarios (1) ──────────< (N) sales_goals  [created_by]
pedidos (tabela independente)
```

---

## 6. Outros módulos e rotas

- **Orders:** `GET/POST/PUT/DELETE /api/orders`, notificações 15/45 dias, stats.
- **Dashboard:** `GET /api/dashboard/overview`, `/sales`, `/production`, `/after-sales`.
- **Sales goals:** `GET/POST /api/sales-goals`, histórico.
- **Sync:** `POST /api/sync/full`, `/incremental`, `GET /api/sync/status`, `/stats`.

---

## 7. Checklist rápido

- [ ] API rodando (`npm run start:dev` ou `start:prod`)
- [ ] PostgreSQL acessível e `.env` com `DB_*` e `JWT_SECRET`
- [ ] Health: `GET http://localhost:3001/health`
- [ ] Login: `POST http://localhost:3001/api/auth/login` com `email` e `password`
- [ ] Swagger: `http://localhost:3001/api/docs`
