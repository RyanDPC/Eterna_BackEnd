@echo off
echo =========================================
echo    DEMARRAGE ETERNA BACKEND - DEV
echo =========================================

echo.
echo [1/4] Verification des pre-requis...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js n'est pas installe ou pas dans le PATH
    pause
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ npm n'est pas installe ou pas dans le PATH
    pause
    exit /b 1
)

echo ✅ Node.js et npm detectes

echo.
echo [2/4] Installation des dependances...
if not exist "node_modules" (
    echo 📦 Installation des packages...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Erreur lors de l'installation des dependances
        pause
        exit /b 1
    )
) else (
    echo ✅ Dependances deja installees
)

echo.
echo [3/4] Generation du client Prisma...
npx prisma generate
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de la generation du client Prisma
    pause
    exit /b 1
)

echo.
echo [4/4] Demarrage du serveur de developpement...
echo.
echo 🌐 Serveur HTTP: http://localhost:8080
echo 🔌 WebSocket: ws://localhost:8081
echo 📊 Swagger UI: http://localhost:8080/api/docs
echo.
echo Appuyez sur Ctrl+C pour arreter le serveur
echo.

npm run start:dev

pause
