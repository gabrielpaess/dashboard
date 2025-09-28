#!/bin/bash

# Script para iniciar ambiente de desenvolvimento
echo "🚀 Iniciando ambiente de desenvolvimento..."

# Verificar se estamos no diretório correto
if [ ! -f "docker-compose.dev.yml" ]; then
    echo "❌ Arquivo docker-compose.dev.yml não encontrado!"
    echo "Certifique-se de estar no diretório correto do projeto."
    exit 1
fi

# Verificar se Docker está rodando
echo "🔍 Verificando Docker..."
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando!"
    echo "Por favor, inicie o Docker Desktop primeiro."
    echo ""
    echo "Se estiver usando WSL, certifique-se de que:"
    echo "1. Docker Desktop está rodando no Windows"
    echo "2. WSL2 integration está habilitada no Docker Desktop"
    echo "3. Sua distribuição WSL está marcada nas configurações"
    exit 1
fi

echo "✅ Docker está rodando"

# Verificar se docker-compose está disponível
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose não encontrado!"
    echo "Tentando usar 'docker compose'..."
    if ! docker compose version &> /dev/null; then
        echo "❌ Nem docker-compose nem docker compose estão disponíveis!"
        exit 1
    else
        COMPOSE_CMD="docker compose"
    fi
else
    COMPOSE_CMD="docker-compose"
fi

echo "✅ Usando comando: $COMPOSE_CMD"

# Parar containers existentes
echo "🛑 Parando containers existentes..."
$COMPOSE_CMD -f docker-compose.dev.yml down

# Construir e iniciar containers
echo "🔨 Construindo e iniciando containers..."
$COMPOSE_CMD -f docker-compose.dev.yml up --build -d

# Aguardar containers iniciarem
echo "⏳ Aguardando containers iniciarem..."
sleep 20

# Verificar status dos containers
echo "📊 Verificando status dos containers..."
$COMPOSE_CMD -f docker-compose.dev.yml ps

# Verificar se todos os containers estão rodando
echo "🔍 Verificando saúde dos containers..."
if ! $COMPOSE_CMD -f docker-compose.dev.yml ps | grep -q "Up"; then
    echo "❌ Alguns containers não estão rodando!"
    echo "Verificando logs..."
    $COMPOSE_CMD -f docker-compose.dev.yml logs --tail=10
    exit 1
fi

# Testar API
echo "🧪 Testando API..."
if command -v node &> /dev/null; then
    node test-api.js
else
    echo "⚠️  Node.js não encontrado, pulando teste da API"
    echo "Você pode testar manualmente em: http://localhost:3001/health"
fi

echo ""
echo "🎉 Ambiente iniciado com sucesso!"
echo "🌐 Frontend: http://localhost:5173"
echo "🔗 API: http://localhost:3001"
echo "🗄️  Banco: localhost:5432"
echo "🧪 Teste API: http://localhost:5173?test"
echo ""
echo "📋 Comandos úteis:"
echo "  Para parar: $COMPOSE_CMD -f docker-compose.dev.yml down"
echo "  Para ver logs: $COMPOSE_CMD -f docker-compose.dev.yml logs -f"
echo "  Para ver logs da API: $COMPOSE_CMD -f docker-compose.dev.yml logs -f api"
echo "  Para reiniciar: $COMPOSE_CMD -f docker-compose.dev.yml restart"
