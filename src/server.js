const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Import des routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const teamRoutes = require('./routes/teams');
const roomRoutes = require('./routes/rooms');
const messageRoutes = require('./routes/messages');
const oauthRoutes = require('./routes/oauth');

// Import des middlewares
const { errorHandler } = require('./middlewares/errorHandler');
const { authMiddleware } = require('./middlewares/auth');

// Import des services
const { initializeSocket } = require('./services/socketService');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:1420',
      'https://eterna-frontend.onrender.com'
    ],
    credentials: true
  }
});

// Configuration du trust proxy pour Render
app.set('trust proxy', 1);

// Middlewares de sécurité
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite chaque IP à 100 requêtes par fenêtre
  message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true
});
app.use('/api/', limiter);

// Middlewares de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Configuration CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:1420',
    'https://eterna-frontend.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Configuration des sessions
app.use(session({
  secret: process.env.SESSION_SECRET || 'eterna-super-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production' || process.env.RENDER === 'true',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 heures
    sameSite: process.env.NODE_ENV === 'production' || process.env.RENDER === 'true' ? 'none' : 'lax'
  }
}));

// Initialisation de Passport
app.use(passport.initialize());
app.use(passport.session());

// Configuration des stratégies Passport
require('./config/passport');

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/teams', authMiddleware, teamRoutes);
app.use('/api/rooms', authMiddleware, roomRoutes);
app.use('/api/messages', authMiddleware, messageRoutes);

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Route racine
app.get('/', (req, res) => {
  res.json({
    message: 'API ETERNA Backend',
    version: '2.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Gestion des routes non trouvées
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route non trouvée',
    message: `La route ${req.originalUrl} n'existe pas`,
    timestamp: new Date().toISOString()
  });
});

// Middleware de gestion d'erreurs
app.use(errorHandler);

// Initialisation des WebSockets
initializeSocket(io);

// Configuration du port
const PORT = process.env.PORT || 8080;

// Démarrage du serveur
server.listen(PORT, () => {
  console.log(`🚀 Serveur ETERNA démarré sur le port ${PORT}`);
  console.log(`📚 API disponible sur http://localhost:${PORT}/api`);
  console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
  
  if (process.env.NODE_ENV === 'production' && process.env.RENDER === 'true') {
    console.log(`🌐 Mode production - Render détecté`);
  }
});

// Gestion des erreurs non capturées
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesse rejetée non gérée:', reason);
  console.error('📍 Promesse:', promise);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Exception non capturée:', error);
  process.exit(1);
});

module.exports = { app, server };
