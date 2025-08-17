const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        error: 'Token d\'authentification manquant',
        message: 'Veuillez fournir un token JWT valide'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'eterna-jwt-secret-key');
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        profile: true,
        socialAccounts: true,
        permissions: true
      }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Utilisateur non trouvé',
        message: 'Le token est invalide ou l\'utilisateur n\'existe plus'
      });
    }

    // Vérifier si le token n'est pas révoqué
    const refreshToken = await prisma.refreshToken.findFirst({
      where: {
        userId: user.id,
        token: token,
        isRevoked: false,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (!refreshToken) {
      return res.status(401).json({
        error: 'Token révoqué ou expiré',
        message: 'Veuillez vous reconnecter'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Token invalide',
        message: 'Le token JWT fourni est invalide'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expiré',
        message: 'Le token JWT a expiré, veuillez vous reconnecter'
      });
    }

    console.error('Erreur lors de l\'authentification:', error);
    return res.status(500).json({
      error: 'Erreur d\'authentification',
      message: 'Une erreur est survenue lors de la vérification du token'
    });
  }
};

const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'eterna-jwt-secret-key');
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        profile: true,
        socialAccounts: true
      }
    });

    req.user = user || null;
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentification requise',
        message: 'Vous devez être connecté pour accéder à cette ressource'
      });
    }

    if (!Array.isArray(roles)) {
      roles = [roles];
    }

    // Vérifier les rôles dans les équipes
    const hasTeamRole = req.user.teams?.some(member => 
      roles.includes(member.role)
    );

    // Vérifier les rôles dans les salons
    const hasRoomRole = req.user.rooms?.some(member => 
      roles.includes(member.role)
    );

    // Vérifier les permissions utilisateur
    const hasPermission = req.user.permissions?.some(permission => 
      roles.includes(permission.permission) && permission.granted
    );

    if (!hasTeamRole && !hasRoomRole && !hasPermission) {
      return res.status(403).json({
        error: 'Accès refusé',
        message: 'Vous n\'avez pas les permissions nécessaires pour accéder à cette ressource'
      });
    }

    next();
  };
};

const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentification requise',
        message: 'Vous devez être connecté pour accéder à cette ressource'
      });
    }

    const hasPermission = req.user.permissions?.some(p => 
      p.permission === permission && p.granted
    );

    if (!hasPermission) {
      return res.status(403).json({
        error: 'Permission requise',
        message: `Vous devez avoir la permission '${permission}' pour accéder à cette ressource`
      });
    }

    next();
  };
};

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
  requireRole,
  requirePermission
};
