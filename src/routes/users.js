const express = require('express');
const { body, validationResult } = require('express-validator');
const { asyncHandler } = require('../middlewares/errorHandler');
const { requirePermission } = require('../middlewares/auth');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// ===== VALIDATION DES DONNÉES =====

const validateUserUpdate = [
  body('username').optional().isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_]+$/),
  body('bio').optional().isLength({ max: 500 }),
  body('firstName').optional().isLength({ min: 1, max: 50 }),
  body('lastName').optional().isLength({ min: 1, max: 50 }),
  body('phone').optional().isMobilePhone(),
  body('location').optional().isLength({ max: 100 }),
  body('website').optional().isURL()
];

// ===== ROUTES DES UTILISATEURS =====

// Récupérer tous les utilisateurs (avec pagination)
router.get('/', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const search = req.query.search || '';
  const onlineOnly = req.query.online === 'true';

  const skip = (page - 1) * limit;

  // Construire les filtres
  const where = {};
  
  if (search) {
    where.OR = [
      { username: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { profile: { firstName: { contains: search, mode: 'insensitive' } } },
      { profile: { lastName: { contains: search, mode: 'insensitive' } } }
    ];
  }

  if (onlineOnly) {
    where.isOnline = true;
  }

  // Récupérer les utilisateurs
  const users = await prisma.user.findMany({
    where,
    include: {
      profile: true,
      socialAccounts: {
        select: {
          provider: true,
          providerId: true
        }
      }
    },
    skip,
    take: limit,
    orderBy: [
      { isOnline: 'desc' },
      { lastSeen: 'desc' },
      { username: 'asc' }
    ]
  });

  // Compter le total
  const total = await prisma.user.count({ where });

  res.json({
    success: true,
    data: {
      users: users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
        createdAt: user.createdAt,
        profile: user.profile,
        socialAccounts: user.socialAccounts
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// Récupérer un utilisateur par ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      profile: true,
      socialAccounts: {
        select: {
          provider: true,
          providerId: true
        }
      },
      teams: {
        include: {
          team: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      },
      ownedTeams: {
        select: {
          id: true,
          name: true,
          avatar: true
        }
      }
    }
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'Utilisateur non trouvé'
    });
  }

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        profile: user.profile,
        socialAccounts: user.socialAccounts,
        teams: user.teams,
        ownedTeams: user.ownedTeams
      }
    }
  });
}));

// Mettre à jour le profil utilisateur
router.put('/:id', validateUserUpdate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Vérifier que l'utilisateur peut modifier ce profil
  if (id !== userId && !req.user.permissions?.some(p => p.permission === 'MANAGE_USERS' && p.granted)) {
    return res.status(403).json({
      success: false,
      error: 'Permissions insuffisantes',
      message: 'Vous ne pouvez modifier que votre propre profil'
    });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Données invalides',
      details: errors.array()
    });
  }

  const { username, bio, firstName, lastName, phone, location, website } = req.body;

  // Vérifier si le nom d'utilisateur est déjà pris
  if (username && username !== req.user.username) {
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Nom d\'utilisateur déjà pris',
        message: 'Ce nom d\'utilisateur est déjà utilisé'
      });
    }
  }

  // Mettre à jour l'utilisateur
  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      username,
      bio,
      profile: {
        upsert: {
          create: {
            firstName,
            lastName,
            phone,
            location,
            website
          },
          update: {
            firstName,
            lastName,
            phone,
            location,
            website
          }
        }
      }
    },
    include: {
      profile: true
    }
  });

  res.json({
    success: true,
    message: 'Profil mis à jour avec succès',
    data: {
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        bio: updatedUser.bio,
        isOnline: updatedUser.isOnline,
        lastSeen: updatedUser.lastSeen,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
        profile: updatedUser.profile
      }
    }
  });
}));

// Mettre à jour l'avatar
router.put('/:id/avatar', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { avatarUrl } = req.body;

  if (!avatarUrl) {
    return res.status(400).json({
      success: false,
      error: 'URL d\'avatar manquante'
    });
  }

  // Vérifier que l'utilisateur peut modifier ce profil
  if (id !== req.user.id && !req.user.permissions?.some(p => p.permission === 'MANAGE_USERS' && p.granted)) {
    return res.status(403).json({
      success: false,
      error: 'Permissions insuffisantes'
    });
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { avatar: avatarUrl }
  });

  res.json({
    success: true,
    message: 'Avatar mis à jour avec succès',
    data: {
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        avatar: updatedUser.avatar
      }
    }
  });
}));

// Supprimer un utilisateur
router.delete('/:id', requirePermission('MANAGE_USERS'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Empêcher la suppression de son propre compte
  if (id === req.user.id) {
    return res.status(400).json({
      success: false,
      error: 'Impossible de supprimer son propre compte',
      message: 'Vous ne pouvez pas supprimer votre propre compte'
    });
  }

  const user = await prisma.user.findUnique({
    where: { id }
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'Utilisateur non trouvé'
    });
  }

  // Supprimer l'utilisateur (cascade automatique via Prisma)
  await prisma.user.delete({
    where: { id }
  });

  res.json({
    success: true,
    message: 'Utilisateur supprimé avec succès'
  });
}));

// Rechercher des utilisateurs
router.get('/search/:query', asyncHandler(async (req, res) => {
  const { query } = req.params;
  const limit = parseInt(req.query.limit) || 10;

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { username: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { profile: { firstName: { contains: query, mode: 'insensitive' } } },
        { profile: { lastName: { contains: query, mode: 'insensitive' } } }
      ]
    },
    include: {
      profile: true
    },
    take: limit,
    orderBy: [
      { isOnline: 'desc' },
      { username: 'asc' }
    ]
  });

  res.json({
    success: true,
    data: {
      users: users.map(user => ({
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        isOnline: user.isOnline,
        profile: user.profile
      }))
    }
  });
}));

// Obtenir les utilisateurs en ligne
router.get('/online/list', asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;

  const onlineUsers = await prisma.user.findMany({
    where: { isOnline: true },
    include: {
      profile: true
    },
    take: limit,
    orderBy: { lastSeen: 'desc' }
  });

  res.json({
    success: true,
    data: {
      users: onlineUsers.map(user => ({
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        lastSeen: user.lastSeen,
        profile: user.profile
      })),
      count: onlineUsers.length
    }
  });
}));

// Obtenir les statistiques des utilisateurs
router.get('/stats/overview', requirePermission('VIEW_AUDIT_LOGS'), asyncHandler(async (req, res) => {
  const totalUsers = await prisma.user.count();
  const onlineUsers = await prisma.user.count({ where: { isOnline: true } });
  const verifiedUsers = await prisma.user.count({ where: { isEmailVerified: true } });
  const todayUsers = await prisma.user.count({
    where: {
      createdAt: {
        gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    }
  });

  const usersByProvider = await prisma.socialAccount.groupBy({
    by: ['provider'],
    _count: {
      provider: true
    }
  });

  res.json({
    success: true,
    data: {
      total: totalUsers,
      online: onlineUsers,
      verified: verifiedUsers,
      today: todayUsers,
      byProvider: usersByProvider.reduce((acc, item) => {
        acc[item.provider.toLowerCase()] = item._count.provider;
        return acc;
      }, {})
    }
  });
}));

module.exports = router;
