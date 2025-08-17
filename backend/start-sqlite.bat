@echo off
echo =========================================
echo    DEMARRAGE ETERNA BACKEND - SQLITE
echo =========================================

echo.
echo [1/5] Verification des pre-requis...
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
echo [2/5] Installation des dependances...
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
echo [3/5] Generation du client Prisma...
npx prisma generate
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de la generation du client Prisma
    pause
    exit /b 1
)

echo.
echo [4/5] Configuration de la base SQLite...
if not exist ".env" (
    echo 📝 Creation du fichier .env...
    copy env.example .env
    echo ✅ Fichier .env cree
) else (
    echo ✅ Fichier .env existe deja
)

echo.
echo [5/5] Demarrage du serveur avec SQLite...
echo.
echo 🗄️ Base de donnees: SQLite (dev.db)
echo 🌐 Serveur HTTP: http://localhost:8080
echo 🔌 WebSocket: ws://localhost:8081
echo 📊 Swagger UI: http://localhost:8080/api/docs
echo 👁️ SQLite Viewer: http://localhost:8082
echo.
echo Appuyez sur Ctrl+C pour arreter le serveur
echo.

npm run dev:setup

pause
