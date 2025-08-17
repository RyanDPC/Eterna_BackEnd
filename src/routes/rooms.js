const express = require('express');
const { body, validationResult } = require('express-validator');
const { asyncHandler } = require('../middlewares/errorHandler');
const { requireRole } = require('../middlewares/auth');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// ===== VALIDATION DES DONNÉES =====

const validateRoomCreate = [
  body('name').isLength({ min: 2, max: 100 }).trim(),
  body('description').optional().isLength({ max: 500 }),
  body('isPrivate').optional().isBoolean(),
  body('isDirect').optional().isBoolean(),
  body('maxMembers').optional().isInt({ min: 2, max: 1000 }),
  body('teamId').optional().isString()
];

const validateRoomUpdate = [
  body('name').optional().isLength({ min: 2, max: 100 }).trim(),
  body('description').optional().isLength({ max: 500 }),
  body('isPrivate').optional().isBoolean(),
  body('maxMembers').optional().isInt({ min: 2, max: 1000 })
];

const validateMemberRole = [
  body('role').isIn(['MEMBER', 'MODERATOR', 'ADMIN'])
];

// ===== ROUTES DES SALONS =====

// Créer un salon
router.post('/', validateRoomCreate, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Données invalides',
      details: errors.array()
    });
  }

  const { name, description, isPrivate = false, isDirect = false, maxMembers = 100, teamId } = req.body;
  const ownerId = req.user.id;

  // Vérifier si le nom de salon est déjà pris dans l'équipe
  if (teamId) {
    const existingRoom = await prisma.room.findFirst({
      where: {
        name,
        teamId
      }
    });

    if (existingRoom) {
      return res.status(409).json({
        success: false,
        error: 'Nom de salon déjà pris',
        message: 'Un salon avec ce nom existe déjà dans cette équipe'
      });
    }

    // Vérifier que l'utilisateur est membre de l'équipe
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: ownerId,
          teamId
        }
      }
    });

    if (!teamMember) {
      return res.status(403).json({
        success: false,
        error: 'Accès refusé',
        message: 'Vous devez être membre de l\'équipe pour créer un salon'
      });
    }
  }

  // Créer le salon
  const room = await prisma.room.create({
    data: {
      name,
      description,
      isPrivate,
      isDirect,
      maxMembers,
      teamId,
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
      team: {
        select: {
          id: true,
          name: true,
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
    message: 'Salon créé avec succès',
    data: { room }
  });
}));

// Récupérer tous les salons (avec pagination)
router.get('/', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const search = req.query.search || '';
  const teamId = req.query.teamId;
  const isDirect = req.query.isDirect === 'true';
  const userId = req.user.id;

  const skip = (page - 1) * limit;

  // Construire les filtres
  const where = {};
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  if (teamId) {
    where.teamId = teamId;
  }

  if (isDirect !== undefined) {
    where.isDirect = isDirect;
  }

  // Filtrer par accès utilisateur
  where.OR = [
    { isPrivate: false }, // Salons publics
    { members: { some: { userId } } }, // Salons où l'utilisateur est membre
    { ownerId: userId } // Salons créés par l'utilisateur
  ];

  // Récupérer les salons
  const rooms = await prisma.room.findMany({
    where,
    include: {
      owner: {
        select: {
          id: true,
          username: true,
          avatar: true
        }
      },
      team: {
        select: {
          id: true,
          name: true,
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
          messages: true
        }
      }
    },
    skip,
    take: limit,
    orderBy: [
      { isDirect: 'asc' },
      { createdAt: 'desc' },
      { name: 'asc' }
    ]
  });

  // Compter le total
  const total = await prisma.room.count({ where });

  res.json({
    success: true,
    data: {
      rooms,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// Récupérer un salon par ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const room = await prisma.room.findUnique({
    where: { id },
    include: {
      owner: {
        select: {
          id: true,
          username: true,
          avatar: true
        }
      },
      team: {
        select: {
          id: true,
          name: true,
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
      pinnedMessages: {
        include: {
          message: {
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
      },
      _count: {
        select: {
          members: true,
          messages: true
        }
      }
    }
  });

  if (!room) {
    return res.status(404).json({
      success: false,
      error: 'Salon non trouvé'
    });
  }

  // Vérifier l'accès
  const isMember = room.members.some(member => member.userId === userId);
  const isOwner = room.ownerId === userId;
  const isPrivate = room.isPrivate;

  if (!isMember && !isOwner && isPrivate) {
    return res.status(403).json({
      success: false,
      error: 'Accès refusé',
      message: 'Ce salon est privé et vous n\'êtes pas membre'
    });
  }

  res.json({
    success: true,
    data: { room }
  });
}));

// Mettre à jour un salon
router.put('/:id', validateRoomUpdate, requireRole(['OWNER', 'ADMIN']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Données invalides',
      details: errors.array()
    });
  }

  const { name, description, isPrivate, maxMembers } = req.body;

  // Vérifier si le salon existe
  const existingRoom = await prisma.room.findUnique({
    where: { id },
    include: {
      members: {
        where: { userId: req.user.id }
      }
    }
  });

  if (!existingRoom) {
    return res.status(404).json({
      success: false,
      error: 'Salon non trouvé'
    });
  }

  // Vérifier les permissions
  const userRole = existingRoom.members[0]?.role;
  if (!['OWNER', 'ADMIN'].includes(userRole)) {
    return res.status(403).json({
      success: false,
      error: 'Permissions insuffisantes',
      message: 'Vous devez être propriétaire ou administrateur pour modifier ce salon'
    });
  }

  // Vérifier si le nom est déjà pris (sauf pour ce salon)
  if (name && name !== existingRoom.name) {
    const nameExists = await prisma.room.findFirst({
      where: {
        name,
        teamId: existingRoom.teamId,
        id: { not: id }
      }
    });

    if (nameExists) {
      return res.status(409).json({
        success: false,
        error: 'Nom de salon déjà pris',
        message: 'Un autre salon utilise déjà ce nom dans cette équipe'
      });
    }
  }

  // Mettre à jour le salon
  const updatedRoom = await prisma.room.update({
    where: { id },
    data: {
      name,
      description,
      isPrivate,
      maxMembers
    },
    include: {
      owner: {
        select: {
          id: true,
          username: true,
          avatar: true
        }
      },
      team: {
        select: {
          id: true,
          name: true,
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
    message: 'Salon mis à jour avec succès',
    data: { room: updatedRoom }
  });
}));

// Supprimer un salon
router.delete('/:id', requireRole('OWNER'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  const room = await prisma.room.findUnique({
    where: { id },
    include: {
      members: {
        where: { userId: req.user.id }
      }
    }
  });

  if (!room) {
    return res.status(404).json({
      success: false,
      error: 'Salon non trouvé'
    });
  }

  // Vérifier que l'utilisateur est le propriétaire
  if (room.members[0]?.role !== 'OWNER') {
    return res.status(403).json({
      success: false,
      error: 'Permissions insuffisantes',
      message: 'Seul le propriétaire peut supprimer ce salon'
    });
  }

  // Supprimer le salon (cascade automatique via Prisma)
  await prisma.room.delete({
    where: { id }
  });

  res.json({
    success: true,
    message: 'Salon supprimé avec succès'
  });
}));

// ===== GESTION DES MEMBRES =====

// Ajouter un membre à un salon
router.post('/:id/members', validateMemberRole, requireRole(['OWNER', 'ADMIN']), asyncHandler(async (req, res) => {
  const { id: roomId } = req.params;
  const { userId, role = 'MEMBER' } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'ID utilisateur manquant'
    });
  }

  // Vérifier que le salon existe
  const room = await prisma.room.findUnique({
    where: { id: roomId }
  });

  if (!room) {
    return res.status(404).json({
      success: false,
      error: 'Salon non trouvé'
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
  const existingMember = await prisma.roomMember.findUnique({
    where: {
      userId_roomId: {
        userId,
        roomId
      }
    }
  });

  if (existingMember) {
    return res.status(409).json({
      success: false,
      error: 'Utilisateur déjà membre',
      message: 'Cet utilisateur est déjà membre de ce salon'
    });
  }

  // Vérifier la limite de membres
  const memberCount = await prisma.roomMember.count({
    where: { roomId }
  });

  if (memberCount >= room.maxMembers) {
    return res.status(400).json({
      success: false,
      error: 'Limite de membres atteinte',
      message: 'Ce salon a atteint sa limite de membres'
    });
  }

  // Ajouter le membre
  const member = await prisma.roomMember.create({
    data: {
      userId,
      roomId,
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
  const { id: roomId, userId } = req.params;
  const { role } = req.body;

  // Vérifier que le salon existe
  const room = await prisma.room.findUnique({
    where: { id: roomId }
  });

  if (!room) {
    return res.status(404).json({
      success: false,
      error: 'Salon non trouvé'
    });
  }

  // Vérifier que le membre existe
  const member = await prisma.roomMember.findUnique({
    where: {
      userId_roomId: {
        userId,
        roomId
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
  const updatedMember = await prisma.roomMember.update({
    where: {
      userId_roomId: {
        userId,
        roomId
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

// Supprimer un membre d'un salon
router.delete('/:id/members/:userId', requireRole(['OWNER', 'ADMIN']), asyncHandler(async (req, res) => {
  const { id: roomId, userId } = req.params;

  // Vérifier que le salon existe
  const room = await prisma.room.findUnique({
    where: { id: roomId }
  });

  if (!room) {
    return res.status(404).json({
      success: false,
      error: 'Salon non trouvé'
    });
  }

  // Vérifier que le membre existe
  const member = await prisma.roomMember.findUnique({
    where: {
      userId_roomId: {
        userId,
        roomId
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
      message: 'Le propriétaire ne peut pas être supprimé du salon'
    });
  }

  // Supprimer le membre
  await prisma.roomMember.delete({
    where: {
      userId_roomId: {
        userId,
        roomId
      }
    }
  });

  res.json({
    success: true,
    message: 'Membre supprimé avec succès'
  });
}));

// Rejoindre un salon
router.post('/:id/join', asyncHandler(async (req, res) => {
  const { id: roomId } = req.params;
  const userId = req.user.id;

  // Vérifier que le salon existe
  const room = await prisma.room.findUnique({
    where: { id: roomId }
  });

  if (!room) {
    return res.status(404).json({
      success: false,
      error: 'Salon non trouvé'
    });
  }

  // Vérifier que le salon n'est pas privé
  if (room.isPrivate) {
    return res.status(403).json({
      success: false,
      error: 'Salon privé',
      message: 'Ce salon est privé, vous ne pouvez pas le rejoindre'
    });
  }

  // Vérifier si l'utilisateur est déjà membre
  const existingMember = await prisma.roomMember.findUnique({
    where: {
      userId_roomId: {
        userId,
        roomId
      }
    }
  });

  if (existingMember) {
    return res.status(409).json({
      success: false,
      error: 'Déjà membre',
      message: 'Vous êtes déjà membre de ce salon'
    });
  }

  // Vérifier la limite de membres
  const memberCount = await prisma.roomMember.count({
    where: { roomId }
  });

  if (memberCount >= room.maxMembers) {
    return res.status(400).json({
      success: false,
      error: 'Limite de membres atteinte',
      message: 'Ce salon a atteint sa limite de membres'
    });
  }

  // Rejoindre le salon
  const member = await prisma.roomMember.create({
    data: {
      userId,
      roomId,
      role: 'MEMBER'
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
    message: 'Salon rejoint avec succès',
    data: { member }
  });
}));

// Quitter un salon
router.delete('/:id/members/me', asyncHandler(async (req, res) => {
  const { id: roomId } = req.params;
  const userId = req.user.id;

  // Vérifier que le salon existe
  const room = await prisma.room.findUnique({
    where: { id: roomId }
  });

  if (!room) {
    return res.status(404).json({
      success: false,
      error: 'Salon non trouvé'
    });
  }

  // Vérifier que l'utilisateur est membre
  const member = await prisma.roomMember.findUnique({
    where: {
      userId_roomId: {
        userId,
        roomId
      }
    }
  });

  if (!member) {
    return res.status(404).json({
      success: false,
      error: 'Vous n\'êtes pas membre de ce salon'
    });
  }

  // Empêcher le propriétaire de quitter le salon
  if (member.role === 'OWNER') {
    return res.status(403).json({
      success: false,
      error: 'Impossible de quitter le salon',
      message: 'Le propriétaire ne peut pas quitter le salon. Transférez d\'abord la propriété.'
    });
  }

  // Quitter le salon
  await prisma.roomMember.delete({
    where: {
      userId_roomId: {
        userId,
        roomId
      }
    }
  });

  res.json({
    success: true,
    message: 'Vous avez quitté le salon avec succès'
  });
}));

// Rechercher des salons
router.get('/search/:query', asyncHandler(async (req, res) => {
  const { query } = req.params;
  const limit = parseInt(req.query.limit) || 10;
  const userId = req.user.id;

  const rooms = await prisma.room.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } }
      ],
      OR: [
        { isPrivate: false },
        { members: { some: { userId } } },
        { ownerId: userId }
      ]
    },
    include: {
      owner: {
        select: {
          id: true,
          username: true,
          avatar: true
        }
      },
      team: {
        select: {
          id: true,
          name: true,
          avatar: true
        }
      },
      _count: {
        select: {
          members: true,
          messages: true
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
    data: { rooms }
  });
}));

module.exports = router;
