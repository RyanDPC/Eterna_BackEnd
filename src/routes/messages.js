const express = require('express');
const { body, validationResult } = require('express-validator');
const { asyncHandler } = require('../middlewares/errorHandler');
const { requireRole } = require('../middlewares/auth');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// ===== VALIDATION DES DONNÉES =====

const validateMessageCreate = [
  body('content').isLength({ min: 1, max: 2000 }).trim(),
  body('type').optional().isIn(['TEXT', 'IMAGE', 'FILE', 'AUDIO', 'VIDEO', 'SYSTEM']),
  body('replyToId').optional().isString(),
  body('parentId').optional().isString()
];

const validateMessageUpdate = [
  body('content').isLength({ min: 1, max: 2000 }).trim()
];

// ===== ROUTES DES MESSAGES =====

// Créer un message
router.post('/', validateMessageCreate, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Données invalides',
      details: errors.array()
    });
  }

  const { content, type = 'TEXT', replyToId, parentId, roomId } = req.body;
  const userId = req.user.id;

  // Vérifier que le salon existe
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      members: {
        where: { userId }
      }
    }
  });

  if (!room) {
    return res.status(404).json({
      success: false,
      error: 'Salon non trouvé'
    });
  }

  // Vérifier que l'utilisateur est membre du salon
  if (!room.members.length && room.ownerId !== userId) {
    return res.status(403).json({
      success: false,
      error: 'Accès refusé',
      message: 'Vous devez être membre de ce salon pour envoyer des messages'
    });
  }

  // Vérifier le message de réponse s'il existe
  if (replyToId) {
    const replyMessage = await prisma.message.findUnique({
      where: { id: replyToId }
    });

    if (!replyMessage) {
      return res.status(404).json({
        success: false,
        error: 'Message de réponse non trouvé'
      });
    }
  }

  // Vérifier le message parent s'il existe
  if (parentId) {
    const parentMessage = await prisma.message.findUnique({
      where: { id: parentId }
    });

    if (!parentMessage) {
      return res.status(404).json({
        success: false,
        error: 'Message parent non trouvé'
      });
    }
  }

  // Créer le message
  const message = await prisma.message.create({
    data: {
      content,
      type,
      userId,
      roomId,
      replyToId,
      parentId
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatar: true
        }
      },
      replyTo: {
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
      parent: {
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
    message: 'Message envoyé avec succès',
    data: { message }
  });
}));

// Récupérer les messages d'un salon (avec pagination)
router.get('/room/:roomId', asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const beforeId = req.query.beforeId;
  const afterId = req.query.afterId;
  const userId = req.user.id;

  const skip = (page - 1) * limit;

  // Vérifier que le salon existe
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      members: {
        where: { userId }
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
  const isMember = room.members.length > 0 || room.ownerId === userId;
  if (!isMember && room.isPrivate) {
    return res.status(403).json({
      success: false,
      error: 'Accès refusé',
      message: 'Ce salon est privé et vous n\'êtes pas membre'
    });
  }

  // Construire les filtres
  const where = {
    roomId,
    isDeleted: false
  };

  if (beforeId) {
    where.id = { lt: beforeId };
  }

  if (afterId) {
    where.id = { gt: afterId };
  }

  // Récupérer les messages
  const messages = await prisma.message.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatar: true
        }
      },
      replyTo: {
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
      parent: {
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
    },
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' }
  });

  // Compter le total
  const total = await prisma.message.count({ where });

  res.json({
    success: true,
    data: {
      messages: messages.reverse(), // Remettre dans l'ordre chronologique
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// Récupérer un message par ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const message = await prisma.message.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatar: true
        }
      },
      room: {
        include: {
          members: {
            where: { userId }
          }
        }
      },
      replyTo: {
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
      parent: {
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
      replies: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      },
      thread: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  if (!message) {
    return res.status(404).json({
      success: false,
      error: 'Message non trouvé'
    });
  }

  // Vérifier l'accès au salon
  const room = message.room;
  const isMember = room.members.length > 0 || room.ownerId === userId;
  if (!isMember && room.isPrivate) {
    return res.status(403).json({
      success: false,
      error: 'Accès refusé',
      message: 'Ce salon est privé et vous n\'êtes pas membre'
    });
  }

  res.json({
    success: true,
    data: { message }
  });
}));

// Mettre à jour un message
router.put('/:id', validateMessageUpdate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const userId = req.user.id;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Données invalides',
      details: errors.array()
    });
  }

  // Vérifier que le message existe
  const message = await prisma.message.findUnique({
    where: { id },
    include: {
      room: {
        include: {
          members: {
            where: { userId }
          }
        }
      }
    }
  });

  if (!message) {
    return res.status(404).json({
      success: false,
      error: 'Message non trouvé'
    });
  }

  // Vérifier que l'utilisateur peut modifier ce message
  const isOwner = message.userId === userId;
  const isModerator = message.room.members.some(member => 
    member.userId === userId && ['MODERATOR', 'ADMIN'].includes(member.role)
  );
  const isRoomOwner = message.room.ownerId === userId;

  if (!isOwner && !isModerator && !isRoomOwner) {
    return res.status(403).json({
      success: false,
      error: 'Permissions insuffisantes',
      message: 'Vous ne pouvez modifier que vos propres messages'
    });
  }

  // Vérifier que le message n'est pas supprimé
  if (message.isDeleted) {
    return res.status(400).json({
      success: false,
      error: 'Message supprimé',
      message: 'Impossible de modifier un message supprimé'
    });
  }

  // Mettre à jour le message
  const updatedMessage = await prisma.message.update({
    where: { id },
    data: {
      content,
      isEdited: true
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatar: true
        }
      },
      room: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  res.json({
    success: true,
    message: 'Message mis à jour avec succès',
    data: { message: updatedMessage }
  });
}));

// Supprimer un message
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Vérifier que le message existe
  const message = await prisma.message.findUnique({
    where: { id },
    include: {
      room: {
        include: {
          members: {
            where: { userId }
          }
        }
      }
    }
  });

  if (!message) {
    return res.status(404).json({
      success: false,
      error: 'Message non trouvé'
    });
  }

  // Vérifier que l'utilisateur peut supprimer ce message
  const isOwner = message.userId === userId;
  const isModerator = message.room.members.some(member => 
    member.userId === userId && ['MODERATOR', 'ADMIN'].includes(member.role)
  );
  const isRoomOwner = message.room.ownerId === userId;

  if (!isOwner && !isModerator && !isRoomOwner) {
    return res.status(403).json({
      success: false,
      error: 'Permissions insuffisantes',
      message: 'Vous ne pouvez supprimer que vos propres messages'
    });
  }

  // Vérifier que le message n'est pas déjà supprimé
  if (message.isDeleted) {
    return res.status(400).json({
      success: false,
      error: 'Message déjà supprimé'
    });
  }

  // Supprimer le message (soft delete)
  await prisma.message.update({
    where: { id },
    data: {
      isDeleted: true,
      content: '[Message supprimé]'
    }
  });

  res.json({
    success: true,
    message: 'Message supprimé avec succès'
  });
}));

// Épingler un message
router.post('/:id/pin', requireRole(['MODERATOR', 'ADMIN']), asyncHandler(async (req, res) => {
  const { id: messageId } = req.params;
  const userId = req.user.id;

  // Vérifier que le message existe
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      room: {
        include: {
          members: {
            where: { userId }
          }
        }
      }
    }
  });

  if (!message) {
    return res.status(404).json({
      success: false,
      error: 'Message non trouvé'
    });
  }

  // Vérifier que l'utilisateur est modérateur du salon
  const isModerator = message.room.members.some(member => 
    member.userId === userId && ['MODERATOR', 'ADMIN'].includes(member.role)
  );
  const isRoomOwner = message.room.ownerId === userId;

  if (!isModerator && !isRoomOwner) {
    return res.status(403).json({
      success: false,
      error: 'Permissions insuffisantes',
      message: 'Vous devez être modérateur pour épingler des messages'
    });
  }

  // Vérifier si le message est déjà épinglé
  const existingPin = await prisma.pinnedMessage.findUnique({
    where: {
      messageId_roomId: {
        messageId,
        roomId: message.roomId
      }
    }
  });

  if (existingPin) {
    return res.status(409).json({
      success: false,
      error: 'Message déjà épinglé',
      message: 'Ce message est déjà épinglé dans ce salon'
    });
  }

  // Épingler le message
  const pinnedMessage = await prisma.pinnedMessage.create({
    data: {
      messageId,
      roomId: message.roomId,
      pinnedBy: userId
    },
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
  });

  res.status(201).json({
    success: true,
    message: 'Message épinglé avec succès',
    data: { pinnedMessage }
  });
}));

// Désépingler un message
router.delete('/:id/pin', requireRole(['MODERATOR', 'ADMIN']), asyncHandler(async (req, res) => {
  const { id: messageId } = req.params;
  const userId = req.user.id;

  // Vérifier que le message existe
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      room: {
        include: {
          members: {
            where: { userId }
          }
        }
      }
    }
  });

  if (!message) {
    return res.status(404).json({
      success: false,
      error: 'Message non trouvé'
    });
  }

  // Vérifier que l'utilisateur est modérateur du salon
  const isModerator = message.room.members.some(member => 
    member.userId === userId && ['MODERATOR', 'ADMIN'].includes(member.role)
  );
  const isRoomOwner = message.room.ownerId === userId;

  if (!isModerator && !isRoomOwner) {
    return res.status(403).json({
      success: false,
      error: 'Permissions insuffisantes',
      message: 'Vous devez être modérateur pour désépingler des messages'
    });
  }

  // Désépingler le message
  await prisma.pinnedMessage.delete({
    where: {
      messageId_roomId: {
        messageId,
        roomId: message.roomId
      }
    }
  });

  res.json({
    success: true,
    message: 'Message désépinglé avec succès'
  });
}));

// Rechercher des messages
router.get('/search/:query', asyncHandler(async (req, res) => {
  const { query } = req.params;
  const roomId = req.query.roomId;
  const limit = parseInt(req.query.limit) || 20;
  const userId = req.user.id;

  // Construire les filtres
  const where = {
    content: { contains: query, mode: 'insensitive' },
    isDeleted: false
  };

  if (roomId) {
    where.roomId = roomId;
  }

  // Récupérer les messages
  const messages = await prisma.message.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatar: true
        }
      },
      room: {
        include: {
          members: {
            where: { userId }
          }
        }
      }
    },
    take: limit,
    orderBy: { createdAt: 'desc' }
  });

  // Filtrer par accès utilisateur
  const accessibleMessages = messages.filter(message => {
    const room = message.room;
    const isMember = room.members.length > 0 || room.ownerId === userId;
    return !room.isPrivate || isMember;
  });

  res.json({
    success: true,
    data: {
      messages: accessibleMessages,
      count: accessibleMessages.length
    }
  });
}));

// Obtenir les messages épinglés d'un salon
router.get('/room/:roomId/pinned', asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user.id;

  // Vérifier que le salon existe
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      members: {
        where: { userId }
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
  const isMember = room.members.length > 0 || room.ownerId === userId;
  if (!isMember && room.isPrivate) {
    return res.status(403).json({
      success: false,
      error: 'Accès refusé',
      message: 'Ce salon est privé et vous n\'êtes pas membre'
    });
  }

  // Récupérer les messages épinglés
  const pinnedMessages = await prisma.pinnedMessage.findMany({
    where: { roomId },
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
    },
    orderBy: { pinnedAt: 'desc' }
  });

  res.json({
    success: true,
    data: { pinnedMessages }
  });
}));

module.exports = router;
