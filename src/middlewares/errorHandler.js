const { Prisma } = require('@prisma/client');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log de l'erreur
  console.error('❌ Erreur:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Erreurs Prisma
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        error.message = 'Un enregistrement avec cette valeur unique existe déjà';
        error.statusCode = 400;
        break;
      case 'P2025':
        error.message = 'Enregistrement non trouvé';
        error.statusCode = 404;
        break;
      case 'P2003':
        error.message = 'Violation de contrainte de clé étrangère';
        error.statusCode = 400;
        break;
      case 'P2014':
        error.message = 'Violation de contrainte de clé primaire';
        error.statusCode = 400;
        break;
      default:
        error.message = 'Erreur de base de données';
        error.statusCode = 500;
    }
  }

  // Erreurs de validation
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error.message = message;
    error.statusCode = 400;
  }

  // Erreurs JWT
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Token JWT invalide';
    error.statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token JWT expiré';
    error.statusCode = 401;
  }

  // Erreurs de type
  if (err.name === 'TypeError') {
    error.message = 'Type de données invalide';
    error.statusCode = 400;
  }

  // Erreurs de syntaxe JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error.message = 'JSON invalide dans le corps de la requête';
    error.statusCode = 400;
  }

  // Erreurs de limite de taille
  if (err.code === 'LIMIT_FILE_SIZE') {
    error.message = 'Fichier trop volumineux';
    error.statusCode = 413;
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error.message = 'Champ de fichier inattendu';
    error.statusCode = 400;
  }

  // Erreurs de rate limiting
  if (err.status === 429) {
    error.message = 'Trop de requêtes, veuillez réessayer plus tard';
    error.statusCode = 429;
  }

  // Erreurs de CORS
  if (err.message && err.message.includes('CORS')) {
    error.message = 'Erreur CORS - Origine non autorisée';
    error.statusCode = 403;
  }

  // Erreurs de session
  if (err.code === 'SESSION_EXPIRED') {
    error.message = 'Session expirée, veuillez vous reconnecter';
    error.statusCode = 401;
  }

  // Erreurs d'authentification
  if (err.code === 'AUTH_REQUIRED') {
    error.message = 'Authentification requise';
    error.statusCode = 401;
  }

  if (err.code === 'INSUFFICIENT_PERMISSIONS') {
    error.message = 'Permissions insuffisantes';
    error.statusCode = 403;
  }

  // Erreurs de base de données
  if (err.code === 'DB_CONNECTION_ERROR') {
    error.message = 'Erreur de connexion à la base de données';
    error.statusCode = 503;
  }

  if (err.code === 'DB_QUERY_ERROR') {
    error.message = 'Erreur lors de l\'exécution de la requête';
    error.statusCode = 500;
  }

  // Erreurs de fichiers
  if (err.code === 'FILE_UPLOAD_ERROR') {
    error.message = 'Erreur lors du téléchargement du fichier';
    error.statusCode = 500;
  }

  if (err.code === 'FILE_NOT_FOUND') {
    error.message = 'Fichier non trouvé';
    error.statusCode = 404;
  }

  // Erreurs d'email
  if (err.code === 'EMAIL_SEND_ERROR') {
    error.message = 'Erreur lors de l\'envoi de l\'email';
    error.statusCode = 500;
  }

  // Erreurs OAuth
  if (err.code === 'OAUTH_ERROR') {
    error.message = 'Erreur lors de l\'authentification OAuth';
    error.statusCode = 500;
  }

  if (err.code === 'OAUTH_CALLBACK_ERROR') {
    error.message = 'Erreur lors du callback OAuth';
    error.statusCode = 500;
  }

  // Erreurs WebSocket
  if (err.code === 'WEBSOCKET_ERROR') {
    error.message = 'Erreur de connexion WebSocket';
    error.statusCode = 500;
  }

  // Erreurs de validation des données
  if (err.code === 'VALIDATION_ERROR') {
    error.message = 'Données invalides';
    error.statusCode = 400;
  }

  // Erreurs de ressources
  if (err.code === 'RESOURCE_NOT_FOUND') {
    error.message = 'Ressource non trouvée';
    error.statusCode = 404;
  }

  if (err.code === 'RESOURCE_ALREADY_EXISTS') {
    error.message = 'Ressource déjà existante';
    error.statusCode = 409;
  }

  // Erreurs de conflit
  if (err.code === 'CONFLICT') {
    error.message = 'Conflit de données';
    error.statusCode = 409;
  }

  // Erreurs de limite
  if (err.code === 'RATE_LIMIT_EXCEEDED') {
    error.message = 'Limite de taux dépassée';
    error.statusCode = 429;
  }

  // Erreurs de maintenance
  if (err.code === 'MAINTENANCE_MODE') {
    error.message = 'Service en maintenance';
    error.statusCode = 503;
  }

  // Définir le code de statut par défaut
  const statusCode = error.statusCode || err.statusCode || 500;
  const message = error.message || 'Erreur interne du serveur';

  // Réponse d'erreur
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code: error.code || 'INTERNAL_ERROR',
      statusCode,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method
    },
    // Ajouter des détails de debug en développement
    ...(process.env.NODE_ENV === 'development' && {
      debug: {
        stack: err.stack,
        originalError: err.message
      }
    })
  });
};

// Middleware pour capturer les erreurs asynchrones
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Middleware pour gérer les erreurs 404
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route non trouvée',
      code: 'ROUTE_NOT_FOUND',
      statusCode: 404,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method
    }
  });
};

module.exports = {
  errorHandler,
  asyncHandler,
  notFound
};
