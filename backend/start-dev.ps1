# ===== SCRIPT DE DÉMARRAGE ETERNA BACKEND - DEV =====
# Script PowerShell pour démarrer rapidement le back-end en développement

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "    DÉMARRAGE ETERNA BACKEND - DEV" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

Write-Host ""

# Vérification des prérequis
Write-Host "[1/4] Vérification des prérequis..." -ForegroundColor Yellow

# Vérifier Node.js
try {
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Node.js détecté: $nodeVersion" -ForegroundColor Green
    } else {
        throw "Node.js non trouvé"
    }
} catch {
    Write-Host "❌ Node.js n'est pas installé ou pas dans le PATH" -ForegroundColor Red
    Write-Host "Veuillez installer Node.js depuis https://nodejs.org/" -ForegroundColor Red
    Read-Host "Appuyez sur Entrée pour continuer"
    exit 1
}

# Vérifier npm
try {
    $npmVersion = npm --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ npm détecté: $npmVersion" -ForegroundColor Green
    } else {
        throw "npm non trouvé"
    }
} catch {
    Write-Host "❌ npm n'est pas installé ou pas dans le PATH" -ForegroundColor Red
    Read-Host "Appuyez sur Entrée pour continuer"
    exit 1
}

Write-Host ""

# Installation des dépendances
Write-Host "[2/4] Installation des dépendances..." -ForegroundColor Yellow

if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installation des packages..." -ForegroundColor Blue
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors de l'installation des dépendances" -ForegroundColor Red
        Read-Host "Appuyez sur Entrée pour continuer"
        exit 1
    }
} else {
    Write-Host "✅ Dépendances déjà installées" -ForegroundColor Green
}

Write-Host ""

# Génération du client Prisma
Write-Host "[3/4] Génération du client Prisma..." -ForegroundColor Yellow

npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de la génération du client Prisma" -ForegroundColor Red
    Read-Host "Appuyez sur Entrée pour continuer"
    exit 1
}

Write-Host ""

# Démarrage du serveur
Write-Host "[4/4] Démarrage du serveur de développement..." -ForegroundColor Yellow
Write-Host ""
Write-Host "🌐 Serveur HTTP: http://localhost:8080" -ForegroundColor Green
Write-Host "🔌 WebSocket: ws://localhost:8081" -ForegroundColor Green
Write-Host "📊 Swagger UI: http://localhost:8080/api/docs" -ForegroundColor Green
Write-Host ""
Write-Host "Appuyez sur Ctrl+C pour arrêter le serveur" -ForegroundColor Yellow
Write-Host ""

# Démarrer le serveur
npm run start:dev
