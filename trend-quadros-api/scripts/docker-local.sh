#!/bin/bash

# Script para gerenciar Docker local
# Uso: ./scripts/docker-local.sh [comando]

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  Trend Quadros - Docker Local  ${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Função para verificar se Docker está rodando
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker não está rodando. Inicie o Docker Desktop e tente novamente."
        exit 1
    fi
}

# Função para iniciar serviços
start_services() {
    print_header
    print_message "Iniciando serviços locais..."
    
    check_docker
    
    # Verificar se arquivo .env existe
    if [ ! -f ".env.docker.local" ]; then
        print_warning "Arquivo .env.docker.local não encontrado. Criando a partir do exemplo..."
        cp env.docker.local.example .env.docker.local
        print_message "Arquivo .env.docker.local criado. Ajuste as configurações se necessário."
    fi
    
    # Iniciar serviços
    docker-compose -f docker-compose.local.yml up -d
    
    print_message "Aguardando serviços ficarem prontos..."
    sleep 10
    
    # Verificar status
    docker-compose -f docker-compose.local.yml ps
    
    print_message "Serviços iniciados com sucesso!"
    print_message "API: http://localhost:3001"
    print_message "Frontend: http://localhost:5173"
    print_message "Banco: localhost:5432"
}

# Função para parar serviços
stop_services() {
    print_header
    print_message "Parando serviços locais..."
    
    docker-compose -f docker-compose.local.yml down
    
    print_message "Serviços parados com sucesso!"
}

# Função para reiniciar serviços
restart_services() {
    print_header
    print_message "Reiniciando serviços locais..."
    
    stop_services
    start_services
}

# Função para ver logs
show_logs() {
    print_header
    print_message "Mostrando logs dos serviços..."
    
    docker-compose -f docker-compose.local.yml logs -f
}

# Função para ver status
show_status() {
    print_header
    print_message "Status dos serviços:"
    
    docker-compose -f docker-compose.local.yml ps
}

# Função para executar comandos no container da API
exec_api() {
    print_header
    print_message "Executando comando no container da API..."
    
    docker-compose -f docker-compose.local.yml exec api "$@"
}

# Função para executar migrações
run_migrations() {
    print_header
    print_message "Executando migrações do banco..."
    
    docker-compose -f docker-compose.local.yml exec api npm run migrate
}

# Função para executar testes
run_tests() {
    print_header
    print_message "Executando testes..."
    
    docker-compose -f docker-compose.local.yml exec api npm run test:all
}

# Função para limpar volumes
clean_volumes() {
    print_header
    print_warning "Isso irá remover todos os dados do banco. Tem certeza? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_message "Removendo volumes..."
        docker-compose -f docker-compose.local.yml down -v
        print_message "Volumes removidos com sucesso!"
    else
        print_message "Operação cancelada."
    fi
}

# Função para mostrar ajuda
show_help() {
    print_header
    echo "Comandos disponíveis:"
    echo ""
    echo "  start       - Iniciar todos os serviços"
    echo "  stop        - Parar todos os serviços"
    echo "  restart     - Reiniciar todos os serviços"
    echo "  logs        - Mostrar logs dos serviços"
    echo "  status      - Mostrar status dos serviços"
    echo "  migrate     - Executar migrações do banco"
    echo "  test        - Executar testes"
    echo "  exec        - Executar comando no container da API"
    echo "  clean       - Limpar volumes (remove dados do banco)"
    echo "  help        - Mostrar esta ajuda"
    echo ""
    echo "Exemplos:"
    echo "  ./scripts/docker-local.sh start"
    echo "  ./scripts/docker-local.sh logs"
    echo "  ./scripts/docker-local.sh exec npm run test:api"
    echo "  ./scripts/docker-local.sh migrate"
}

# Main
case "${1:-help}" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    logs)
        show_logs
        ;;
    status)
        show_status
        ;;
    migrate)
        run_migrations
        ;;
    test)
        run_tests
        ;;
    exec)
        shift
        exec_api "$@"
        ;;
    clean)
        clean_volumes
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Comando inválido: $1"
        show_help
        exit 1
        ;;
esac



