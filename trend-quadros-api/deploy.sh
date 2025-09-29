#!/bin/bash

# 🚀 Script de Deploy em Produção - Trend Quadros API
# Uso: ./deploy.sh

set -e  # Parar em caso de erro

echo "🚀 Iniciando deploy da Trend Quadros API..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    print_error "Execute este script no diretório raiz do projeto (onde está o package.json)"
    exit 1
fi

# Verificar se o arquivo .env existe
if [ ! -f ".env" ]; then
    print_error "Arquivo .env não encontrado! Crie o arquivo .env com as configurações de produção."
    print_status "Copie o arquivo env.example para .env e configure as variáveis:"
    print_status "cp env.example .env"
    print_status "nano .env"
    exit 1
fi

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    print_error "Node.js não está instalado!"
    exit 1
fi

# Verificar se o npm está instalado
if ! command -v npm &> /dev/null; then
    print_error "npm não está instalado!"
    exit 1
fi

print_status "Verificando dependências..."

# Verificar se PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    print_warning "PM2 não está instalado. Instalando..."
    npm install -g pm2
    print_success "PM2 instalado com sucesso!"
fi

print_status "Instalando dependências..."
npm install

print_status "Compilando aplicação..."
npm run build

if [ $? -ne 0 ]; then
    print_error "Falha na compilação!"
    exit 1
fi

print_success "Compilação concluída!"

print_status "Executando migrations..."
npm run migrate:prod

if [ $? -ne 0 ]; then
    print_error "Falha nas migrations!"
    exit 1
fi

print_success "Migrations executadas com sucesso!"

print_status "Testando conexão com Tiny API..."
npm run test:tiny

if [ $? -ne 0 ]; then
    print_warning "Teste da Tiny API falhou. Verifique o token no arquivo .env"
fi

print_status "Criando diretório de logs..."
mkdir -p logs

print_status "Criando arquivo de configuração PM2..."

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
    min_uptime: '10s',
    watch: false,
    ignore_watch: ['node_modules', 'logs']
  }]
};
EOF

print_success "Arquivo de configuração PM2 criado!"

# Parar aplicação se estiver rodando
print_status "Parando aplicação existente (se estiver rodando)..."
pm2 stop trend-quadros-api 2>/dev/null || true
pm2 delete trend-quadros-api 2>/dev/null || true

print_status "Iniciando aplicação com PM2..."
pm2 start ecosystem.config.js

print_status "Aguardando aplicação inicializar..."
sleep 5

# Verificar se a aplicação está rodando
if pm2 list | grep -q "trend-quadros-api.*online"; then
    print_success "Aplicação iniciada com sucesso!"
else
    print_error "Falha ao iniciar aplicação!"
    print_status "Verificando logs..."
    pm2 logs trend-quadros-api --lines 20
    exit 1
fi

print_status "Testando endpoints..."

# Testar health check
if curl -s http://localhost:3001/health > /dev/null; then
    print_success "Health check: OK"
else
    print_warning "Health check falhou. Verifique os logs."
fi

# Testar documentação
if curl -s http://localhost:3001/api/docs > /dev/null; then
    print_success "Documentação API: OK"
else
    print_warning "Documentação API não acessível."
fi

print_status "Executando sincronização inicial..."
npm run sync:initial

if [ $? -eq 0 ]; then
    print_success "Sincronização inicial executada com sucesso!"
else
    print_warning "Sincronização inicial falhou. Verifique os logs."
fi

print_success "Deploy concluído com sucesso!"
echo ""
print_status "Comandos úteis:"
echo "  pm2 status                    - Ver status da aplicação"
echo "  pm2 logs trend-quadros-api    - Ver logs"
echo "  pm2 restart trend-quadros-api - Reiniciar aplicação"
echo "  pm2 stop trend-quadros-api    - Parar aplicação"
echo "  pm2 monit                     - Monitorar recursos"
echo ""
print_status "Endpoints disponíveis:"
echo "  http://localhost:3001/health     - Health check"
echo "  http://localhost:3001/api/docs   - Documentação da API"
echo "  http://localhost:3001/api/auth   - Autenticação"
echo "  http://localhost:3001/api/orders - Pedidos"
echo "  http://localhost:3001/api/sync   - Sincronização"
echo ""
print_success "🎉 Deploy finalizado! A API está rodando em produção."
