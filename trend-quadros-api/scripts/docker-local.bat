@echo off
REM Script para gerenciar Docker local no Windows
REM Uso: scripts\docker-local.bat [comando]

setlocal enabledelayedexpansion

REM Cores para output (limitadas no Windows)
set "INFO=[INFO]"
set "WARNING=[WARNING]"
set "ERROR=[ERROR]"

REM Função para imprimir mensagens
:print_message
echo %INFO% %~1
goto :eof

:print_warning
echo %WARNING% %~1
goto :eof

:print_error
echo %ERROR% %~1
goto :eof

:print_header
echo ================================
echo   Trend Quadros - Docker Local
echo ================================
goto :eof

REM Função para verificar se Docker está rodando
:check_docker
docker info >nul 2>&1
if errorlevel 1 (
    call :print_error "Docker não está rodando. Inicie o Docker Desktop e tente novamente."
    exit /b 1
)
goto :eof

REM Função para iniciar serviços
:start_services
call :print_header
call :print_message "Iniciando serviços locais..."

call :check_docker
if errorlevel 1 exit /b 1

REM Verificar se arquivo .env existe
if not exist ".env.docker.local" (
    call :print_warning "Arquivo .env.docker.local não encontrado. Criando a partir do exemplo..."
    copy env.docker.local.example .env.docker.local
    call :print_message "Arquivo .env.docker.local criado. Ajuste as configurações se necessário."
)

REM Iniciar serviços
docker-compose -f docker-compose.local.yml up -d

call :print_message "Aguardando serviços ficarem prontos..."
timeout /t 10 /nobreak >nul

REM Verificar status
docker-compose -f docker-compose.local.yml ps

call :print_message "Serviços iniciados com sucesso!"
call :print_message "API: http://localhost:3001"
call :print_message "Frontend: http://localhost:5173"
call :print_message "Banco: localhost:5432"
goto :eof

REM Função para parar serviços
:stop_services
call :print_header
call :print_message "Parando serviços locais..."

docker-compose -f docker-compose.local.yml down

call :print_message "Serviços parados com sucesso!"
goto :eof

REM Função para reiniciar serviços
:restart_services
call :print_header
call :print_message "Reiniciando serviços locais..."

call :stop_services
call :start_services
goto :eof

REM Função para ver logs
:show_logs
call :print_header
call :print_message "Mostrando logs dos serviços..."

docker-compose -f docker-compose.local.yml logs -f
goto :eof

REM Função para ver status
:show_status
call :print_header
call :print_message "Status dos serviços:"

docker-compose -f docker-compose.local.yml ps
goto :eof

REM Função para executar comandos no container da API
:exec_api
call :print_header
call :print_message "Executando comando no container da API..."

docker-compose -f docker-compose.local.yml exec api %*
goto :eof

REM Função para executar migrações
:run_migrations
call :print_header
call :print_message "Executando migrações do banco..."

docker-compose -f docker-compose.local.yml exec api npm run migrate
goto :eof

REM Função para executar testes
:run_tests
call :print_header
call :print_message "Executando testes..."

docker-compose -f docker-compose.local.yml exec api npm run test:all
goto :eof

REM Função para limpar volumes
:clean_volumes
call :print_header
call :print_warning "Isso irá remover todos os dados do banco. Tem certeza? (y/N)"
set /p response=
if /i "%response%"=="y" (
    call :print_message "Removendo volumes..."
    docker-compose -f docker-compose.local.yml down -v
    call :print_message "Volumes removidos com sucesso!"
) else (
    call :print_message "Operação cancelada."
)
goto :eof

REM Função para mostrar ajuda
:show_help
call :print_header
echo Comandos disponíveis:
echo.
echo   start       - Iniciar todos os serviços
echo   stop        - Parar todos os serviços
echo   restart     - Reiniciar todos os serviços
echo   logs        - Mostrar logs dos serviços
echo   status      - Mostrar status dos serviços
echo   migrate     - Executar migrações do banco
echo   test        - Executar testes
echo   exec        - Executar comando no container da API
echo   clean       - Limpar volumes (remove dados do banco)
echo   help        - Mostrar esta ajuda
echo.
echo Exemplos:
echo   scripts\docker-local.bat start
echo   scripts\docker-local.bat logs
echo   scripts\docker-local.bat exec npm run test:api
echo   scripts\docker-local.bat migrate
goto :eof

REM Main
if "%1"=="" goto :show_help
if "%1"=="start" goto :start_services
if "%1"=="stop" goto :stop_services
if "%1"=="restart" goto :restart_services
if "%1"=="logs" goto :show_logs
if "%1"=="status" goto :show_status
if "%1"=="migrate" goto :run_migrations
if "%1"=="test" goto :run_tests
if "%1"=="exec" goto :exec_api
if "%1"=="clean" goto :clean_volumes
if "%1"=="help" goto :show_help
if "%1"=="--help" goto :show_help
if "%1"=="-h" goto :show_help

call :print_error "Comando inválido: %1"
goto :show_help









