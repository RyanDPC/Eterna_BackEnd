const express = require('express');
const { body, validationResult } = require('express-validator');
const { asyncHandler } = require('../middlewares/errorHandler');
const { requireRole } = require('../middlewares/auth');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// ===== VALIDATION DES DONNÉES =====

const validateTeamCreate = [
  body('name').isLength({ min: 2, max: 100 }).trim(),
  body('description').optional().isLength({ max: 500 }),
  body('isPublic').optional().isBoolean()
];

const validateTeamUpdate = [
  body('name').optional().isLength({ min: 2, max: 100 }).trim(),
  body('description').optional().isLength({ max: 500 }),
  body('isPublic').optional().isBoolean()
];

const validateMemberRole = [
  body('role').isIn(['MEMBER', 'MODERATOR', 'ADMIN'])
];

// ===== ROUTES DES ÉQUIPES =====

// Créer une équipe
router.post('/', validateTeamCreate, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Données invalides',
      details: errors.array()
    });
  }

  const { name, description, isPublic = false } = req.body;
  const ownerId = req.user.id;

  // Vérifier si le nom d'équipe est déjà pris
  const existingTeam = await prisma.team.findFirst({
    where: { name }
  });

  if (existingTeam) {
    return res.status(409).json({
      success: false,
      error: 'Nom d\'équipe déjà pris',
      message: 'Une équipe avec ce nom existe déjà'
    });
  }

  // Créer l'équipe
  const team = await prisma.team.create({
    data: {
      name,
      description,
      isPublic,
      ownerId,
      members: {
        create: {
          userId: ownerId,
          role: 'OWNER'
        }
      }
    },
    include: {
      owner: {
        select: {
          id: true,
          username: true,
          avatar: true
        }
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          }
        }
      }
    }
  });

  res.status(201).json({
    success: true,
    message: 'Équipe créée avec succès',
    data: { team }
  });
}));

// Récupérer toutes les équipes (avec pagination)
router.get('/', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const search = req.query.search || '';
  const publicOnly = req.query.public === 'true';
  const userId = req.query.userId;

  const skip = (page - 1) * limit;

  // Construire les filtres
  const where = {};
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  if (publicOnly) {
    where.isPublic = true;
  }

  if (userId) {
    where.members = {
      some: { userId }
    };
  }

  // Récupérer les équipes
  const teams = await prisma.team.findMany({
    where,
    include: {
      owner: {
        select: {
          id: true,
          username: true,
          avatar: true
        }
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          }
        }
      },
      _count: {
        select: {
          members: true,
          rooms: true
        }
      }
    },
    skip,
    take: limit,
    orderBy: [
      { createdAt: 'desc' },
      { name: 'asc' }
    ]
  });

  // Compter le total
  const total = await prisma.team.count({ where });

  res.json({
    success: true,
    data: {
      teams,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// Récupérer une équipe par ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      owner: {
        select: {
          id: true,
          username: true,
          avatar: true
        }
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          }
        }
      },
      rooms: {
        include: {
          _count: {
            select: {
              members: true,
              messages: true
            }
          }
        }
      },
      _count: {
        select: {
          members: true,
          rooms: true
        }
      }
    }
  });

  if (!team) {
    return res.status(404).json({
      success: false,
      error: 'Équipe non trouvée'
    });
  }

  // Vérifier si l'utilisateur est membre de l'équipe
  const isMember = team.members.some(member => member.userId === req.user.id);
  const isPublic = team.isPublic;

  if (!isMember && !isPublic) {
    return res.status(403).json({
      success: false,
      error: 'Accès refusé',
      message: 'Cette équipe est privée et vous n\'êtes pas membre'
    });
  }

  res.json({
    success: true,
    data: { team }
  });
}));

// Mettre à jour une équipe
router.put('/:id', validateTeamUpdate, requireRole(['OWNER', 'ADMIN']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Données invalides',
      details: errors.array()
    });
  }

  const { name, description, isPublic } = req.body;

  // Vérifier si l'équipe existe
  const existingTeam = await prisma.team.findUnique({
    where: { id },
    include: {
      members: {
        where: { userId: req.user.id }
      }
    }
  });

  if (!existingTeam) {
    return res.status(404).json({
      success: false,
      error: 'Équipe non trouvée'
    });
  }

  // Vérifier les permissions
  const userRole = existingTeam.members[0]?.role;
  if (!['OWNER', 'ADMIN'].includes(userRole)) {
    return res.status(403).json({
      success: false,
      error: 'Permissions insuffisantes',
      message: 'Vous devez être propriétaire ou administrateur pour modifier cette équipe'
    });
  }

  // Vérifier si le nom est déjà pris (sauf pour cette équipe)
  if (name && name !== existingTeam.name) {
    const nameExists = await prisma.team.findFirst({
      where: {
        name,
        id: { not: id }
      }
    });

    if (nameExists) {
      return res.status(409).json({
        success: false,
        error: 'Nom d\'équipe déjà pris',
        message: 'Une autre équipe utilise déjà ce nom'
      });
    }
  }

  // Mettre à jour l'équipe
  const updatedTeam = await prisma.team.update({
    where: { id },
    data: {
      name,
      description,
      isPublic
    },
    include: {
      owner: {
        select: {
          id: true,
          username: true,
          avatar: true
        }
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          }
        }
      }
    }
  });

  res.json({
    success: true,
    message: 'Équipe mise à jour avec succès',
    data: { team: updatedTeam }
  });
}));

// Supprimer une équipe
router.delete('/:id', requireRole('OWNER'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      members: {
        where: { userId: req.user.id }
      }
    }
  });

  if (!team) {
    return res.status(404).json({
      success: false,
      error: 'Équipe non trouvée'
    });
  }

  // Vérifier que l'utilisateur est le propriétaire
  if (team.members[0]?.role !== 'OWNER') {
    return res.status(403).json({
      success: false,
      error: 'Permissions insuffisantes',
      message: 'Seul le propriétaire peut supprimer cette équipe'
    });
  }

  // Supprimer l'équipe (cascade automatique via Prisma)
  await prisma.team.delete({
    where: { id }
  });

  res.json({
    success: true,
    message: 'Équipe supprimée avec succès'
  });
}));

// ===== GESTION DES MEMBRES =====

// Ajouter un membre à une équipe
router.post('/:id/members', validateMemberRole, requireRole(['OWNER', 'ADMIN']), asyncHandler(async (req, res) => {
  const { id: teamId } = req.params;
  const { userId, role = 'MEMBER' } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'ID utilisateur manquant'
    });
  }

  // Vérifier que l'équipe existe
  const team = await prisma.team.findUnique({
    where: { id: teamId }
  });

  if (!team) {
    return res.status(404).json({
      success: false,
      error: 'Équipe non trouvée'
    });
  }

  // Vérifier que l'utilisateur existe
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'Utilisateur non trouvé'
    });
  }

  // Vérifier si l'utilisateur est déjà membre
  const existingMember = await prisma.teamMember.findUnique({
    where: {
      userId_teamId: {
        userId,
        teamId
      }
    }
  });

  if (existingMember) {
    return res.status(409).json({
      success: false,
      error: 'Utilisateur déjà membre',
      message: 'Cet utilisateur est déjà membre de cette équipe'
    });
  }

  // Ajouter le membre
  const member = await prisma.teamMember.create({
    data: {
      userId,
      teamId,
      role
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatar: true
        }
      }
    }
  });

  res.status(201).json({
    success: true,
    message: 'Membre ajouté avec succès',
    data: { member }
  });
}));

// Mettre à jour le rôle d'un membre
router.put('/:id/members/:userId', validateMemberRole, requireRole(['OWNER', 'ADMIN']), asyncHandler(async (req, res) => {
  const { id: teamId, userId } = req.params;
  const { role } = req.body;

  // Vérifier que l'équipe existe
  const team = await prisma.team.findUnique({
    where: { id: teamId }
  });

  if (!team) {
    return res.status(404).json({
      success: false,
      error: 'Équipe non trouvée'
    });
  }

  // Vérifier que le membre existe
  const member = await prisma.teamMember.findUnique({
    where: {
      userId_teamId: {
        userId,
        teamId
      }
    }
  });

  if (!member) {
    return res.status(404).json({
      success: false,
      error: 'Membre non trouvé'
    });
  }

  // Empêcher la modification du rôle du propriétaire
  if (member.role === 'OWNER') {
    return res.status(403).json({
      success: false,
      error: 'Impossible de modifier le propriétaire',
      message: 'Le rôle du propriétaire ne peut pas être modifié'
    });
  }

  // Mettre à jour le rôle
  const updatedMember = await prisma.teamMember.update({
    where: {
      userId_teamId: {
        userId,
        teamId
      }
    },
    data: { role },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatar: true
        }
      }
    }
  });

  res.json({
    success: true,
    message: 'Rôle mis à jour avec succès',
    data: { member: updatedMember }
  });
}));

// Supprimer un membre d'une équipe
router.delete('/:id/members/:userId', requireRole(['OWNER', 'ADMIN']), asyncHandler(async (req, res) => {
  const { id: teamId, userId } = req.params;

  // Vérifier que l'équipe existe
  const team = await prisma.team.findUnique({
    where: { id: teamId }
  });

  if (!team) {
    return res.status(404).json({
      success: false,
      error: 'Équipe non trouvée'
    });
  }

  // Vérifier que le membre existe
  const member = await prisma.teamMember.findUnique({
    where: {
      userId_teamId: {
        userId,
        teamId
      }
    }
  });

  if (!member) {
    return res.status(404).json({
      success: false,
      error: 'Membre non trouvé'
    });
  }

  // Empêcher la suppression du propriétaire
  if (member.role === 'OWNER') {
    return res.status(403).json({
      success: false,
      error: 'Impossible de supprimer le propriétaire',
      message: 'Le propriétaire ne peut pas être supprimé de l\'équipe'
    });
  }

  // Supprimer le membre
  await prisma.teamMember.delete({
    where: {
      userId_teamId: {
        userId,
        teamId
      }
    }
  });

  res.json({
    success: true,
    message: 'Membre supprimé avec succès'
  });
}));

// Quitter une équipe
router.delete('/:id/members/me', asyncHandler(async (req, res) => {
  const { id: teamId } = req.params;
  const userId = req.user.id;

  // Vérifier que l'équipe existe
  const team = await prisma.team.findUnique({
    where: { id: teamId }
  });

  if (!team) {
    return res.status(404).json({
      success: false,
      error: 'Équipe non trouvée'
    });
  }

  // Vérifier que l'utilisateur est membre
  const member = await prisma.teamMember.findUnique({
    where: {
      userId_teamId: {
        userId,
        teamId
      }
    }
  });

  if (!member) {
    return res.status(404).json({
      success: false,
      error: 'Vous n\'êtes pas membre de cette équipe'
    });
  }

  // Empêcher le propriétaire de quitter l'équipe
  if (member.role === 'OWNER') {
    return res.status(403).json({
      success: false,
      error: 'Impossible de quitter l\'équipe',
      message: 'Le propriétaire ne peut pas quitter l\'équipe. Transférez d\'abord la propriété.'
    });
  }

  // Quitter l'équipe
  await prisma.teamMember.delete({
    where: {
      userId_teamId: {
        userId,
        teamId
      }
    }
  });

  res.json({
    success: true,
    message: 'Vous avez quitté l\'équipe avec succès'
  });
}));

// Rechercher des équipes
router.get('/search/:query', asyncHandler(async (req, res) => {
  const { query } = req.params;
  const limit = parseInt(req.query.limit) || 10;

  const teams = await prisma.team.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } }
      ],
      isPublic: true
    },
    include: {
      owner: {
        select: {
          id: true,
          username: true,
          avatar: true
        }
      },
      _count: {
        select: {
          members: true
        }
      }
    },
    take: limit,
    orderBy: [
      { _count: { members: 'desc' } },
      { name: 'asc' }
    ]
  });

  res.json({
    success: true,
    data: { teams }
  });
}));

module.exports = router;
