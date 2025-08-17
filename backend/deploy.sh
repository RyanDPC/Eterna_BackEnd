#!/bin/bash

# ===== SCRIPT DE DÉPLOIEMENT ETERNA BACKEND =====
# Ce script automatise le déploiement sur Render

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="eterna-backend"
RENDER_TOKEN="${RENDER_TOKEN}"
SERVICE_ID="${RENDER_SERVICE_ID}"

# Fonction pour afficher les messages
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Vérification des prérequis
check_prerequisites() {
    log "Vérification des prérequis..."
    
    if ! command -v git &> /dev/null; then
        error "Git n'est pas installé"
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        error "Node.js n'est pas installé"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        error "npm n'est pas installé"
        exit 1
    fi
    
    if [ -z "$RENDER_TOKEN" ]; then
        error "Variable RENDER_TOKEN non définie"
        exit 1
    fi
    
    if [ -z "$SERVICE_ID" ]; then
        error "Variable RENDER_SERVICE_ID non définie"
        exit 1
    fi
    
    log "Tous les prérequis sont satisfaits"
}

# Nettoyage et build
build_project() {
    log "Nettoyage et build du projet..."
    
    # Nettoyage
    rm -rf dist/
    rm -rf node_modules/
    
    # Installation des dépendances
    npm ci --only=production
    
    # Génération du client Prisma
    npx prisma generate
    
    # Build du projet
    npm run build
    
    log "Build terminé avec succès"
}

# Tests
run_tests() {
    log "Exécution des tests..."
    
    if npm run test; then
        log "Tests passés avec succès"
    else
        error "Échec des tests"
        exit 1
    fi
}

# Vérification de la qualité du code
check_code_quality() {
    log "Vérification de la qualité du code..."
    
    # Linting
    if npm run lint; then
        log "Linting passé avec succès"
    else
        warn "Problèmes de linting détectés"
    fi
    
    # Formatage
    if npm run format; then
        log "Formatage appliqué"
    else
        warn "Problèmes de formatage"
    fi
}

# Déploiement sur Render
deploy_to_render() {
    log "Déploiement sur Render..."
    
    # Vérification du statut du service
    info "Vérification du statut du service Render..."
    
    SERVICE_STATUS=$(curl -s -H "Authorization: Bearer $RENDER_TOKEN" \
        "https://api.render.com/v1/services/$SERVICE_ID" | \
        jq -r '.status')
    
    if [ "$SERVICE_STATUS" = "live" ]; then
        log "Service Render en cours d'exécution"
    else
        warn "Service Render non en cours d'exécution (statut: $SERVICE_STATUS)"
    fi
    
    # Déclenchement du déploiement
    info "Déclenchement du déploiement..."
    
    DEPLOY_RESPONSE=$(curl -s -X POST \
        -H "Authorization: Bearer $RENDER_TOKEN" \
        -H "Content-Type: application/json" \
        "https://api.render.com/v1/services/$SERVICE_ID/deploys")
    
    DEPLOY_ID=$(echo "$DEPLOY_RESPONSE" | jq -r '.id')
    
    if [ "$DEPLOY_ID" != "null" ]; then
        log "Déploiement déclenché (ID: $DEPLOY_ID)"
        
        # Attente de la fin du déploiement
        info "Attente de la fin du déploiement..."
        sleep 30
        
        # Vérification du statut
        DEPLOY_STATUS=$(curl -s -H "Authorization: Bearer $RENDER_TOKEN" \
            "https://api.render.com/v1/services/$SERVICE_ID/deploys/$DEPLOY_ID" | \
            jq -r '.status')
        
        if [ "$DEPLOY_STATUS" = "live" ]; then
            log "Déploiement réussi !"
        else
            error "Déploiement échoué (statut: $DEPLOY_STATUS)"
            exit 1
        fi
    else
        error "Échec du déclenchement du déploiement"
        exit 1
    fi
}

# Vérification de la santé du service
health_check() {
    log "Vérification de la santé du service..."
    
    # Attendre que le service soit prêt
    info "Attente du démarrage du service..."
    sleep 60
    
    # Récupération de l'URL du service
    SERVICE_URL=$(curl -s -H "Authorization: Bearer $RENDER_TOKEN" \
        "https://api.render.com/v1/services/$SERVICE_ID" | \
        jq -r '.serviceDetailsUrl')
    
    if [ "$SERVICE_URL" != "null" ]; then
        # Test de l'endpoint de santé
        if curl -f "$SERVICE_URL/health" > /dev/null 2>&1; then
            log "Service en bonne santé"
        else
            error "Service non accessible"
            exit 1
        fi
    else
        error "Impossible de récupérer l'URL du service"
        exit 1
    fi
}

# Fonction principale
main() {
    log "=== DÉPLOIEMENT ETERNA BACKEND ==="
    
    check_prerequisites
    build_project
    run_tests
    check_code_quality
    deploy_to_render
    health_check
    
    log "=== DÉPLOIEMENT TERMINÉ AVEC SUCCÈS ==="
}

# Gestion des erreurs
trap 'error "Erreur sur la ligne $LINENO"' ERR

# Exécution du script
main "$@"
