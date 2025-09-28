# Trend Quadros - Dashboard e API

Sistema completo de dashboard para gerenciamento de pedidos com integração à API Tiny.

## Estrutura do Projeto

```
dashboard/
├── trend-quadros-api/          # API NestJS (Backend)
├── trend-quadros-dashboard/    # Frontend React (Dashboard)
├── docker-compose.yml          # Configuração Docker
├── start.sh                    # Script de inicialização (Linux/Mac)
└── start.bat                   # Script de inicialização (Windows)
```

## Como Executar

### Opção 1: Docker (Recomendado)

1. **Certifique-se de que o Docker Desktop está rodando**

2. **Execute o script de inicialização:**
   - **Windows:** Duplo clique em `start.bat` ou execute no PowerShell
   - **Linux/Mac:** Execute `./start.sh` no terminal

3. **Acesse as aplicações:**
   - **Frontend:** http://localhost:5173
   - **API:** http://localhost:3001
   - **Banco de dados:** localhost:5432

### Opção 2: Desenvolvimento Local

#### API (Backend)
```bash
cd trend-quadros-api
npm install
npm run start:dev
```

#### Dashboard (Frontend)
```bash
cd trend-quadros-dashboard
npm install
npm run dev
```

## Comandos Úteis

### Docker
```bash
# Parar todos os containers
docker-compose down

# Ver logs
docker-compose logs -f

# Ver logs específicos
docker-compose logs -f api
docker-compose logs -f frontend

# Reiniciar containers
docker-compose restart
```

### Desenvolvimento
```bash
# API
cd trend-quadros-api
npm run start:dev    # Modo desenvolvimento
npm run build        # Build para produção
npm run test         # Executar testes

# Dashboard
cd trend-quadros-dashboard
npm run dev          # Modo desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview da build
```

## Configuração

### Variáveis de Ambiente

A API usa as seguintes variáveis de ambiente (já configuradas no docker-compose.yml):

- `DB_HOST`: Host do banco de dados
- `DB_PORT`: Porta do banco de dados
- `DB_NAME`: Nome do banco
- `DB_USER`: Usuário do banco
- `DB_PASSWORD`: Senha do banco
- `TINY_API_TOKEN`: Token da API Tiny
- `JWT_SECRET`: Chave secreta para JWT
- `CORS_ORIGIN`: Origem permitida para CORS

### Banco de Dados

O sistema usa PostgreSQL com as seguintes configurações:
- **Host:** localhost
- **Porta:** 5432
- **Banco:** dashboard
- **Usuário:** postgres
- **Senha:** postgres123

## Funcionalidades

- ✅ Dashboard de vendas em tempo real
- ✅ Integração com API Tiny
- ✅ Sincronização automática de pedidos
- ✅ Autenticação JWT
- ✅ Interface responsiva
- ✅ Métricas de vendas
- ✅ Gestão de usuários

## Tecnologias

### Backend (API)
- NestJS
- TypeORM
- PostgreSQL
- JWT Authentication
- Swagger/OpenAPI

### Frontend (Dashboard)
- React 18
- Vite
- Tailwind CSS
- Radix UI
- Recharts
- Axios

## Suporte

Para dúvidas ou problemas, verifique os logs dos containers ou entre em contato com a equipe de desenvolvimento.

