const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuid } = require('uuid');
const { body, validationResult } = require('express-validator');
const { asyncHandler } = require('../middlewares/errorHandler');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// ===== VALIDATION DES DONNÉES =====

const validateRegistration = [
  body('email').isEmail().normalizeEmail(),
  body('username').isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_]+$/),
  body('password').isLength({ min: 6 }),
  body('firstName').optional().isLength({ min: 1, max: 50 }),
  body('lastName').optional().isLength({ min: 1, max: 50 })
];

const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

const validatePasswordReset = [
  body('email').isEmail().normalizeEmail()
];

// ===== ROUTES D'AUTHENTIFICATION =====

// Inscription
router.post('/register', validateRegistration, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Données invalides',
      details: errors.array()
    });
  }

  const { email, username, password, firstName, lastName } = req.body;

  // Vérifier si l'email ou le nom d'utilisateur existe déjà
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }]
    }
  });

  if (existingUser) {
    return res.status(409).json({
      success: false,
      error: 'Utilisateur déjà existant',
      message: existingUser.email === email 
        ? 'Un compte avec cet email existe déjà'
        : 'Ce nom d\'utilisateur est déjà pris'
    });
  }

  // Hasher le mot de passe
  const hashedPassword = await bcrypt.hash(password, 12);

  // Créer l'utilisateur
  const user = await prisma.user.create({
    data: {
      email,
      username,
      password: hashedPassword,
      profile: {
        create: {
          firstName,
          lastName
        }
      }
    },
    include: {
      profile: true
    }
  });

  // Générer les tokens
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET || 'eterna-jwt-secret-key',
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id, tokenId: uuid() },
    process.env.JWT_SECRET || 'eterna-jwt-secret-key',
    { expiresIn: '7d' }
  );

  // Sauvegarder le refresh token
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
      deviceInfo: {
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        timestamp: new Date().toISOString()
      }
    }
  });

  // Mettre à jour le statut en ligne
  await prisma.user.update({
    where: { id: user.id },
    data: {
      isOnline: true,
      lastSeen: new Date()
    }
  });

  res.status(201).json({
    success: true,
    message: 'Inscription réussie',
    data: {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt
      },
      tokens: {
        access_token: accessToken,
        refresh_token: refreshToken
      }
    }
  });
}));

// Connexion
router.post('/login', validateLogin, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Données invalides',
      details: errors.array()
    });
  }

  const { email, password } = req.body;

  // Trouver l'utilisateur
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      profile: true,
      socialAccounts: true
    }
  });

  if (!user || !user.password) {
    return res.status(401).json({
      success: false,
      error: 'Identifiants invalides',
      message: 'Email ou mot de passe incorrect'
    });
  }

  // Vérifier le mot de passe
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    return res.status(401).json({
      success: false,
      error: 'Identifiants invalides',
      message: 'Email ou mot de passe incorrect'
    });
  }

  // Générer les tokens
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET || 'eterna-jwt-secret-key',
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id, tokenId: uuid() },
    process.env.JWT_SECRET || 'eterna-jwt-secret-key',
    { expiresIn: '7d' }
  );

  // Sauvegarder le refresh token
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
      deviceInfo: {
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        timestamp: new Date().toISOString()
      }
    }
  });

  // Mettre à jour le statut en ligne
  await prisma.user.update({
    where: { id: user.id },
    data: {
      isOnline: true,
      lastSeen: new Date()
    }
  });

  res.json({
    success: true,
    message: 'Connexion réussie',
    data: {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
        isOnline: true,
        lastSeen: user.lastSeen
      },
      tokens: {
        access_token: accessToken,
        refresh_token: refreshToken
      }
    }
  });
}));

// Rafraîchir le token
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    return res.status(400).json({
      success: false,
      error: 'Token de rafraîchissement manquant'
    });
  }

  try {
    // Vérifier le refresh token
    const decoded = jwt.verify(refresh_token, process.env.JWT_SECRET || 'eterna-jwt-secret-key');
    
    // Vérifier que le token existe en base et n'est pas révoqué
    const refreshTokenRecord = await prisma.refreshToken.findFirst({
      where: {
        token: refresh_token,
        userId: decoded.userId,
        isRevoked: false,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (!refreshTokenRecord) {
      return res.status(401).json({
        success: false,
        error: 'Token de rafraîchissement invalide ou expiré'
      });
    }

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        profile: true,
        socialAccounts: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    // Générer un nouveau access token
    const newAccessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'eterna-jwt-secret-key',
      { expiresIn: '15m' }
    );

    res.json({
      success: true,
      message: 'Token rafraîchi avec succès',
      data: {
        access_token: newAccessToken,
        refresh_token: refresh_token
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Token de rafraîchissement invalide'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token de rafraîchissement expiré'
      });
    }

    throw error;
  }
}));

// Déconnexion
router.post('/logout', asyncHandler(async (req, res) => {
  const { refresh_token } = req.body;

  if (refresh_token) {
    // Révoquer le refresh token
    await prisma.refreshToken.updateMany({
      where: { token: refresh_token },
      data: { isRevoked: true }
    });
  }

  // Mettre à jour le statut hors ligne
  if (req.user) {
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        isOnline: false,
        lastSeen: new Date()
      }
    });
  }

  res.json({
    success: true,
    message: 'Déconnexion réussie'
  });
}));

// Réinitialisation du mot de passe
router.post('/forgot-password', validatePasswordReset, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Email invalide',
      details: errors.array()
    });
  }

  const { email } = req.body;

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    // Pour des raisons de sécurité, on ne révèle pas si l'email existe
    return res.json({
      success: true,
      message: 'Si un compte avec cet email existe, un email de réinitialisation a été envoyé'
    });
  }

  // Générer un token de réinitialisation
  const resetToken = uuid();
  const resetExpiry = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 heure

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetPasswordToken: resetToken,
      resetPasswordExpiry: resetExpiry
    }
  });

  // TODO: Envoyer l'email de réinitialisation
  console.log(`Token de réinitialisation pour ${email}: ${resetToken}`);

  res.json({
    success: true,
    message: 'Si un compte avec cet email existe, un email de réinitialisation a été envoyé'
  });
}));

// Réinitialiser le mot de passe
router.post('/reset-password', asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword || newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'Données invalides',
      message: 'Token et nouveau mot de passe (min 6 caractères) requis'
    });
  }

  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken: token,
      resetPasswordExpiry: {
        gt: new Date()
      }
    }
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      error: 'Token invalide ou expiré',
      message: 'Le token de réinitialisation est invalide ou a expiré'
    });
  }

  // Hasher le nouveau mot de passe
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  // Mettre à jour le mot de passe et nettoyer les tokens
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpiry: null
    }
  });

  res.json({
    success: true,
    message: 'Mot de passe réinitialisé avec succès'
  });
}));

// Vérifier l'email
router.post('/verify-email', asyncHandler(async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({
      success: false,
      error: 'Code de vérification manquant'
    });
  }

  const user = await prisma.user.findFirst({
    where: {
      emailVerificationCode: code,
      emailVerificationExpiry: {
        gt: new Date()
      }
    }
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      error: 'Code de vérification invalide ou expiré'
    });
  }

  // Marquer l'email comme vérifié
  await prisma.user.update({
    where: { id: user.id },
    data: {
      isEmailVerified: true,
      emailVerificationCode: null,
      emailVerificationExpiry: null
    }
  });

  res.json({
    success: true,
    message: 'Email vérifié avec succès'
  });
}));

// Profil utilisateur connecté
router.get('/me', asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentification requise'
    });
  }

  res.json({
    success: true,
    data: {
      user: {
        id: req.user.id,
        email: req.user.email,
        username: req.user.username,
        avatar: req.user.avatar,
        bio: req.user.bio,
        isOnline: req.user.isOnline,
        lastSeen: req.user.lastSeen,
        isEmailVerified: req.user.isEmailVerified,
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt,
        profile: req.user.profile,
        socialAccounts: req.user.socialAccounts
      }
    }
  });
}));

module.exports = router;
