#!/bin/bash

# Script de Teste para Sincronização
# Uso: ./test-sync.sh

echo "🧪 Testando sincronização..."

# Testar sincronização manual
echo "📞 Chamando sincronização manual..."
curl -X GET "https://dashboard-zeta-three-34.vercel.app/api/sync-manual" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\nTempo: %{time_total}s\n" \
  -s

echo "\n✅ Teste concluído!"
