@echo off
echo 🚀 Démarrage du backend ETERNA...
echo.

echo 📦 Installation des dépendances...
call npm install

echo.
echo 🗄️ Configuration de la base de données...
call npm run db:generate
call npm run db:push
call npm run db:seed

echo.
echo 🌐 Démarrage du serveur...
call npm run start:prod

pause
