@echo off
echo 🚀 Iniciando Trend Quadros - Dashboard e API
echo ==============================================

REM Verificar se Docker está rodando
echo 🔍 Verificando Docker...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker não está rodando!
    echo Por favor, inicie o Docker Desktop primeiro.
    pause
    exit /b 1
)

echo ✅ Docker está rodando

REM Parar containers existentes
echo 🛑 Parando containers existentes...
docker-compose down

REM Construir e iniciar containers
echo 🔨 Construindo e iniciando containers...
docker-compose up --build -d

REM Aguardar containers iniciarem
echo ⏳ Aguardando containers iniciarem...
timeout /t 30 /nobreak >nul

REM Verificar status dos containers
echo 📊 Verificando status dos containers...
docker-compose ps

echo.
echo 🎉 Ambiente iniciado com sucesso!
echo 🌐 Frontend: http://localhost:5173
echo 🔗 API: http://localhost:3001
echo 🗄️  Banco: localhost:5432
echo.
echo 📋 Comandos úteis:
echo   Para parar: docker-compose down
echo   Para ver logs: docker-compose logs -f
echo   Para ver logs da API: docker-compose logs -f api
echo   Para ver logs do Frontend: docker-compose logs -f frontend
echo   Para reiniciar: docker-compose restart
pause

