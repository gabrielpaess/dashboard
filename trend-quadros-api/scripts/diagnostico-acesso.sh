#!/bin/bash

# 🔍 Script de Diagnóstico de Acesso à API
# Executar na VPS para diagnosticar problemas de conectividade

echo "🔍 DIAGNÓSTICO DE ACESSO À API - VPS"
echo "======================================"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir com cores
print_status() {
    local status=$1
    local message=$2
    if [ "$status" = "OK" ]; then
        echo -e "${GREEN}✅ $message${NC}"
    elif [ "$status" = "ERROR" ]; then
        echo -e "${RED}❌ $message${NC}"
    elif [ "$status" = "WARNING" ]; then
        echo -e "${YELLOW}⚠️  $message${NC}"
    else
        echo -e "${BLUE}ℹ️  $message${NC}"
    fi
}

echo "1. 📊 VERIFICANDO STATUS DO PM2"
echo "================================"
pm2_status=$(pm2 status | grep trend-quadros-api)
if [ -n "$pm2_status" ]; then
    print_status "OK" "PM2 está rodando"
    echo "$pm2_status"
else
    print_status "ERROR" "PM2 não está rodando ou processo não encontrado"
fi
echo ""

echo "2. 🔌 VERIFICANDO PORTA 3001"
echo "============================="
port_status=$(netstat -tlnp | grep :3001)
if [ -n "$port_status" ]; then
    print_status "OK" "Porta 3001 está escutando"
    echo "$port_status"
else
    print_status "ERROR" "Porta 3001 não está escutando"
fi
echo ""

echo "3. 🌐 TESTANDO CONECTIVIDADE LOCAL"
echo "=================================="
local_test=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health 2>/dev/null)
if [ "$local_test" = "200" ]; then
    print_status "OK" "API responde localmente (HTTP 200)"
elif [ "$local_test" = "000" ]; then
    print_status "ERROR" "API não responde localmente"
else
    print_status "WARNING" "API responde com código HTTP: $local_test"
fi
echo ""

echo "4. 🔥 VERIFICANDO FIREWALL UFW"
echo "=============================="
ufw_status=$(sudo ufw status | grep 3001)
if [ -n "$ufw_status" ]; then
    print_status "OK" "Porta 3001 liberada no UFW"
    echo "$ufw_status"
else
    print_status "WARNING" "Porta 3001 não encontrada no UFW"
    echo "Status UFW:"
    sudo ufw status
fi
echo ""

echo "5. ⚙️ VERIFICANDO CONFIGURAÇÃO .env"
echo "=================================="
if [ -f ".env" ]; then
    print_status "OK" "Arquivo .env encontrado"
    
    host_config=$(grep "HOST=" .env)
    port_config=$(grep "PORT=" .env)
    cors_config=$(grep "CORS_ORIGIN=" .env)
    
    if [ -n "$host_config" ]; then
        echo "HOST: $host_config"
        if [[ "$host_config" == *"0.0.0.0"* ]]; then
            print_status "OK" "HOST configurado corretamente (0.0.0.0)"
        else
            print_status "WARNING" "HOST não está configurado como 0.0.0.0"
        fi
    else
        print_status "WARNING" "HOST não configurado no .env"
    fi
    
    if [ -n "$port_config" ]; then
        echo "PORT: $port_config"
        if [[ "$port_config" == *"3001"* ]]; then
            print_status "OK" "PORT configurado corretamente (3001)"
        else
            print_status "WARNING" "PORT não está configurado como 3001"
        fi
    else
        print_status "WARNING" "PORT não configurado no .env"
    fi
    
    if [ -n "$cors_config" ]; then
        echo "CORS: $cors_config"
        print_status "OK" "CORS configurado"
    else
        print_status "WARNING" "CORS não configurado no .env"
    fi
else
    print_status "ERROR" "Arquivo .env não encontrado"
fi
echo ""

echo "6. 📋 VERIFICANDO LOGS RECENTES"
echo "==============================="
print_status "INFO" "Últimas 10 linhas dos logs da API:"
pm2 logs trend-quadros-api --lines 10 --nostream
echo ""

echo "7. 🌍 TESTANDO CONECTIVIDADE EXTERNA"
echo "===================================="
external_ip=$(curl -s ifconfig.me 2>/dev/null)
print_status "INFO" "IP externo da VPS: $external_ip"

# Teste de conectividade externa (simulado)
print_status "INFO" "Para testar externamente, execute no seu computador:"
echo "curl http://$external_ip:3001/health"
echo ""

echo "8. 🔧 COMANDOS DE CORREÇÃO RÁPIDA"
echo "================================="
print_status "INFO" "Se houver problemas, execute:"
echo ""
echo "# Liberar porta no firewall:"
echo "sudo ufw allow 3001"
echo "sudo ufw reload"
echo ""
echo "# Configurar HOST no .env:"
echo "echo 'HOST=0.0.0.0' >> .env"
echo "echo 'PORT=3001' >> .env"
echo "echo 'CORS_ORIGIN=*' >> .env"
echo ""
echo "# Reiniciar API:"
echo "pm2 restart trend-quadros-api"
echo ""

echo "9. 📊 RESUMO DO DIAGNÓSTICO"
echo "==========================="

# Contar problemas
errors=0
warnings=0

# Verificar PM2
if ! pm2 status | grep -q trend-quadros-api; then
    ((errors++))
fi

# Verificar porta
if ! netstat -tlnp | grep -q :3001; then
    ((errors++))
fi

# Verificar teste local
if [ "$local_test" != "200" ]; then
    ((errors++))
fi

# Verificar UFW
if ! sudo ufw status | grep -q 3001; then
    ((warnings++))
fi

# Verificar .env
if [ ! -f ".env" ] || ! grep -q "HOST=0.0.0.0" .env; then
    ((warnings++))
fi

echo "Problemas encontrados:"
echo "- Erros críticos: $errors"
echo "- Avisos: $warnings"
echo ""

if [ $errors -eq 0 ]; then
    print_status "OK" "API deve estar funcionando corretamente!"
    print_status "INFO" "Teste externamente: curl http://$external_ip:3001/health"
else
    print_status "ERROR" "Encontrados $errors problemas críticos que precisam ser corrigidos"
fi

echo ""
echo "🔍 Diagnóstico concluído!"
