#!/bin/sh

# Aguardar o banco de dados estar pronto
echo "Aguardando banco de dados..."
while ! nc -z postgres 5432; do
  sleep 1
done
echo "Banco de dados conectado!"

# Executar migrações
echo "Executando migrações..."
npm run migration:run

# Iniciar a aplicação
echo "Iniciando aplicação..."
npm run start:dev
