@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Skill Connect - Docker Setup
echo ========================================
echo.

REM Check if Docker is installed
where docker >nul 2>nul
if errorlevel 1 (
    echo Error: Docker is not installed
    pause
    exit /b 1
)

echo [OK] Docker found

REM Check if Docker Compose is installed
where docker-compose >nul 2>nul
if errorlevel 1 (
    echo Error: Docker Compose is not installed
    pause
    exit /b 1
)

echo [OK] Docker Compose found
echo.

REM Check if .env file exists
if not exist .env (
    echo Creating .env file from .env.example...
    copy .env.example .env
    echo [OK] .env file created
    echo Please update the .env file with your configuration
    echo.
)

REM Prompt to continue
set /p continue="Ready to start containers? (y/n): "
if /i not "%continue%"=="y" (
    echo Exiting...
    exit /b 0
)

REM Stop existing containers
echo.
echo Stopping existing containers...
docker-compose down 2>nul

REM Build images
echo Building Docker images...
docker-compose build

if errorlevel 1 (
    echo Build failed!
    pause
    exit /b 1
)

echo [OK] Build successful
echo.

REM Start containers
echo Starting containers...
docker-compose up -d

if errorlevel 1 (
    echo Failed to start containers!
    pause
    exit /b 1
)

echo [OK] Containers started
echo.

echo Waiting for services to be ready...
timeout /t 10 /nobreak

echo.
echo ========================================
echo Container Status
echo ========================================
echo.

docker-compose ps

echo.
echo ========================================
echo Service URLs
echo ========================================
echo.

echo Frontend:         http://localhost:3000
echo Backend API:      http://localhost:5000
echo MinIO Console:    http://localhost:9001
echo Mailpit (Email):  http://localhost:8025
echo PostgreSQL:       localhost:5432
echo.

echo ========================================
echo Credentials
echo ========================================
echo.

echo Admin Login:
echo   Email:    admin@skillconnect.com
echo   Password: admin123
echo.

echo MinIO Access:
echo   Username: minioadmin
echo   Password: minioadmin123
echo.

echo Database:
echo   Username: admin
echo   Password: admin123
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.

set /p viewlogs="View logs? (y/n): "
if /i "%viewlogs%"=="y" (
    docker-compose logs -f
)

endlocal
