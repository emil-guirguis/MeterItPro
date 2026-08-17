@echo off
REM MCP Threading System Deployment Script for Windows
REM This script deploys the MCP system with threading architecture

setlocal enabledelayedexpansion

REM Configuration
set DEPLOYMENT_ENV=%1
if "%DEPLOYMENT_ENV%"=="" set DEPLOYMENT_ENV=production
set COMPOSE_FILE=docker-compose.threading.yml
set ENV_FILE=.env.threading

echo.
echo 🚀 MCP Threading System Deployment
echo Environment: %DEPLOYMENT_ENV%
echo.

REM Function to print status messages
:print_status
echo ✅ %~1
goto :eof

:print_warning
echo ⚠️  %~1
goto :eof

:print_error
echo ❌ %~1
goto :eof

:print_info
echo ℹ️  %~1
goto :eof

REM Check prerequisites
:check_prerequisites
call :print_info "Checking prerequisites..."

REM Check Docker
docker --version >nul 2>&1
if errorlevel 1 (
    call :print_error "Docker is not installed"
    exit /b 1
)

REM Check Docker Compose
docker-compose --version >nul 2>&1
if errorlevel 1 (
    call :print_error "Docker Compose is not installed"
    exit /b 1
)

call :print_status "Prerequisites check passed"
goto :eof

REM Setup environment
:setup_environment
call :print_info "Setting up environment..."

REM Create environment file if it doesn't exist
if not exist "%ENV_FILE%" (
    if exist ".env.threading.example" (
        copy .env.threading.example "%ENV_FILE%" >nul
        call :print_warning "Created %ENV_FILE% from example. Please review and update the configuration."
    ) else (
        call :print_error "No environment configuration found"
        exit /b 1
    )
)

REM Create necessary directories
if not exist "logs" mkdir logs
if not exist "uploads" mkdir uploads
if not exist "monitoring\prometheus" mkdir monitoring\prometheus
if not exist "monitoring\grafana\dashboards" mkdir monitoring\grafana\dashboards
if not exist "monitoring\grafana\datasources" mkdir monitoring\grafana\datasources

call :print_status "Environment setup completed"
goto :eof

REM Build and deploy
:deploy
call :print_info "Location and deploying services..."

REM Pull latest images
docker-compose -f "%COMPOSE_FILE%" pull

REM Build custom images
docker-compose -f "%COMPOSE_FILE%" build --no-cache

REM Stop existing services
docker-compose -f "%COMPOSE_FILE%" down

REM Start services
docker-compose -f "%COMPOSE_FILE%" up -d

call :print_status "Services deployed successfully"
goto :eof

REM Wait for services to be healthy
:wait_for_services
call :print_info "Waiting for services to be healthy..."

set /a max_attempts=30
set /a attempt=1

:wait_loop
if !attempt! gtr !max_attempts! (
    call :print_error "Services failed to become healthy within timeout"
    docker-compose -f "%COMPOSE_FILE%" logs
    exit /b 1
)

docker-compose -f "%COMPOSE_FILE%" ps | findstr "Up (healthy)" >nul
if not errorlevel 1 (
    call :print_status "Services are healthy"
    goto :eof
)

echo|set /p="."
timeout /t 10 /nobreak >nul
set /a attempt+=1
goto wait_loop

REM Run health checks
:run_health_checks
call :print_info "Running health checks..."

REM Check backend health
for /f %%i in ('curl -s -o nul -w "%%{http_code}" http://localhost:3001/api/health 2^>nul') do set backend_health=%%i
if "%backend_health%"=="200" (
    call :print_status "Backend health check passed"
) else (
    call :print_error "Backend health check failed (HTTP %backend_health%)"
    exit /b 1
)

REM PostgreSQL health check would go here if using containerized database
REM docker-compose -f "%COMPOSE_FILE%" exec -T postgres pg_isready -U postgres >nul 2>&1

call :print_status "All health checks passed"
goto :eof

REM Show deployment status
:show_status
call :print_info "Deployment Status:"
echo.

REM Show running containers
docker-compose -f "%COMPOSE_FILE%" ps
echo.

REM Show service URLs
echo Service URLs:
echo   Backend API: http://localhost:3001
echo   API Health: http://localhost:3001/api/health
echo   Threading Status: http://localhost:3001/api/threading/status
REM   PostgreSQL: postgresql://localhost:5432 (when using containerized database)

docker-compose -f "%COMPOSE_FILE%" ps | findstr "prometheus" >nul
if not errorlevel 1 echo   Prometheus: http://localhost:9090

docker-compose -f "%COMPOSE_FILE%" ps | findstr "grafana" >nul
if not errorlevel 1 echo   Grafana: http://localhost:3000

echo.

REM Show useful commands
echo Useful Commands:
echo   View logs: docker-compose -f %COMPOSE_FILE% logs -f
echo   Stop services: docker-compose -f %COMPOSE_FILE% down
echo   Restart backend: docker-compose -f %COMPOSE_FILE% restart backend
echo   Threading status: curl -s http://localhost:3001/api/threading/status
echo   Threading restart: curl -X POST http://localhost:3001/api/threading/restart
echo.
goto :eof

REM Cleanup function
:cleanup
call :print_info "Cleaning up old containers and images..."

REM Remove stopped containers
docker container prune -f

REM Remove unused images
docker image prune -f

call :print_status "Cleanup completed"
goto :eof

REM Main deployment flow
:main
echo Starting deployment process...
echo.

call :check_prerequisites
if errorlevel 1 exit /b 1

call :setup_environment
if errorlevel 1 exit /b 1

if "%DEPLOYMENT_ENV%"=="production" (
    call :cleanup
)

call :deploy
if errorlevel 1 exit /b 1

call :wait_for_services
if errorlevel 1 exit /b 1

call :run_health_checks
if errorlevel 1 (
    call :print_error "Deployment completed with health check failures"
    docker-compose -f "%COMPOSE_FILE%" logs --tail=50
    exit /b 1
)

call :show_status
call :print_status "Deployment completed successfully! 🎉"
goto :eof

REM Handle script arguments
if "%1"=="status" (
    call :show_status
) else if "%1"=="health" (
    call :run_health_checks
) else if "%1"=="logs" (
    docker-compose -f "%COMPOSE_FILE%" logs -f %2
) else if "%1"=="stop" (
    call :print_info "Stopping services..."
    docker-compose -f "%COMPOSE_FILE%" down
    call :print_status "Services stopped"
) else if "%1"=="restart" (
    call :print_info "Restarting services..."
    docker-compose -f "%COMPOSE_FILE%" restart %2
    call :print_status "Services restarted"
) else if "%1"=="cleanup" (
    call :cleanup
) else if "%1"=="help" (
    echo Usage: %0 [deploy^|status^|health^|logs^|stop^|restart^|cleanup^|help]
    echo.
    echo Commands:
    echo   deploy   - Deploy the complete system (default)
    echo   status   - Show deployment status
    echo   health   - Run health checks
    echo   logs     - Show service logs
    echo   stop     - Stop all services
    echo   restart  - Restart services
    echo   cleanup  - Clean up old containers and images
    echo   help     - Show this help message
) else (
    call :main
)