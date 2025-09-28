#!/bin/bash

echo "🚀 Iniciando Trend Quadros - Dashboard e API"
echo "=============================================="

# Verificar se Docker está rodando
echo "🔍 Verificando Docker..."
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando!"
    echo "Por favor, inicie o Docker Desktop primeiro."
    exit 1
fi

echo "✅ Docker está rodando"

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker-compose down

# Construir e iniciar containers
echo "🔨 Construindo e iniciando containers..."
docker-compose up --build -d

# Aguardar containers iniciarem
echo "⏳ Aguardando containers iniciarem..."
sleep 30

# Verificar status dos containers
echo "📊 Verificando status dos containers..."
docker-compose ps

echo ""
echo "🎉 Ambiente iniciado com sucesso!"
echo "🌐 Frontend: http://localhost:5173"
echo "🔗 API: http://localhost:3001"
echo "🗄️  Banco: localhost:5432"
echo ""
echo "📋 Comandos úteis:"
echo "  Para parar: docker-compose down"
echo "  Para ver logs: docker-compose logs -f"
echo "  Para ver logs da API: docker-compose logs -f api"
echo "  Para ver logs do Frontend: docker-compose logs -f frontend"
echo "  Para reiniciar: docker-compose restart"

