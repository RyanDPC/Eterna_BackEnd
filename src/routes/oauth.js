const express = require('express');
const passport = require('passport');
const { asyncHandler } = require('../middlewares/errorHandler');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// ===== ROUTES GOOGLE OAUTH =====

// Redirection vers Google OAuth
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

// Callback Google OAuth
router.get('/google/callback', asyncHandler(async (req, res) => {
  passport.authenticate('google', { session: false }, async (err, user) => {
    if (err) {
      console.error('Erreur Google OAuth:', err);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'authentification Google',
        code: 'OAUTH_ERROR'
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentification Google échouée',
        code: 'OAUTH_CALLBACK_ERROR'
      });
    }

    try {
      // Générer les tokens JWT
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

      // Créer le cookie OAuth avec la bonne configuration
      const cookieOptions = {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production' || process.env.RENDER === 'true',
        sameSite: process.env.NODE_ENV === 'production' || process.env.RENDER === 'true' ? 'none' : 'lax',
        maxAge: 5 * 60 * 1000, // 5 minutes
        path: '/',
        domain: process.env.NODE_ENV === 'production' || process.env.RENDER === 'true' ? '.onrender.com' : undefined
      };

      res.cookie('oauth_google_data', JSON.stringify({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          avatar: user.avatar,
          name: user.profile?.firstName && user.profile?.lastName 
            ? `${user.profile.firstName} ${user.profile.lastName}`
            : user.username
        },
        tokens: {
          access_token: accessToken,
          refresh_token: refreshToken
        }
      }), cookieOptions);

      // Rediriger vers la page de succès
      res.redirect('/oauth-success?provider=google');
    } catch (error) {
      console.error('Erreur lors de la génération des tokens:', error);
      res.redirect('/oauth-error?provider=google&error=token_generation_failed');
    }
  })(req, res);
}));

// Récupération des données utilisateur Google
router.get('/google/user', asyncHandler(async (req, res) => {
  const oauthDataCookie = req.cookies['oauth_google_data'];
  
  if (!oauthDataCookie) {
    return res.status(404).json({
      success: false,
      error: 'Données OAuth Google non trouvées',
      message: 'Veuillez d\'abord vous connecter via Google OAuth'
    });
  }

  try {
    const oauthData = JSON.parse(oauthDataCookie);
    
    // Formater la réponse
    const userData = {
      id: `google_${oauthData.user.id}`,
      email: oauthData.user.email,
      name: oauthData.user.name,
      picture: oauthData.user.avatar
    };

    // Nettoyer le cookie après récupération
    res.clearCookie('oauth_google_data');

    res.json({
      success: true,
      user: userData,
      access_token: oauthData.tokens.access_token,
      provider: 'google',
      google_specific: {
        google_id: oauthData.user.id,
        verified_email: true,
        locale: 'fr',
        given_name: oauthData.user.name.split(' ')[0],
        family_name: oauthData.user.name.split(' ').slice(1).join(' '),
        email_verified: true
      }
    });
  } catch (error) {
    console.error('Erreur lors du parsing des données OAuth Google:', error);
    res.status(500).json({
      success: false,
      error: 'Données OAuth Google invalides',
      code: 'OAUTH_ERROR'
    });
  }
}));

// ===== ROUTES STEAM OAUTH =====

// Redirection vers Steam OpenID
router.get('/steam', passport.authenticate('steam'));

// Callback Steam OpenID
router.get('/steam/callback', asyncHandler(async (req, res) => {
  passport.authenticate('steam', { session: false }, async (err, user) => {
    if (err) {
      console.error('Erreur Steam OpenID:', err);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'authentification Steam',
        code: 'OAUTH_ERROR'
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentification Steam échouée',
        code: 'OAUTH_CALLBACK_ERROR'
      });
    }

    try {
      // Générer les tokens JWT
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

      // Créer le cookie OAuth avec la bonne configuration
      const cookieOptions = {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production' || process.env.RENDER === 'true',
        sameSite: process.env.NODE_ENV === 'production' || process.env.RENDER === 'true' ? 'none' : 'lax',
        maxAge: 5 * 60 * 1000, // 5 minutes
        path: '/',
        domain: process.env.NODE_ENV === 'production' || process.env.RENDER === 'true' ? '.onrender.com' : undefined
      };

      res.cookie('oauth_steam_data', JSON.stringify({
        user: {
          steamId: user.socialAccounts.find(acc => acc.provider === 'STEAM')?.providerId,
          username: user.username,
          displayName: user.username,
          avatar: user.avatar,
          realName: user.profile?.firstName
        },
        tokens: {
          access_token: accessToken,
          refresh_token: refreshToken
        }
      }), cookieOptions);

      // Rediriger vers la page de succès
      res.redirect('/oauth-success?provider=steam');
    } catch (error) {
      console.error('Erreur lors de la génération des tokens:', error);
      res.redirect('/oauth-error?provider=steam&error=token_generation_failed');
    }
  })(req, res);
}));

// Récupération des données utilisateur Steam
router.get('/steam/user', asyncHandler(async (req, res) => {
  const oauthDataCookie = req.cookies['oauth_steam_data'];
  
  if (!oauthDataCookie) {
    return res.status(404).json({
      success: false,
      error: 'Données OAuth Steam non trouvées',
      message: 'Veuillez d\'abord vous connecter via Steam OAuth'
    });
  }

  try {
    const oauthData = JSON.parse(oauthDataCookie);
    
    // Formater la réponse
    const userData = {
      id: `steam_${oauthData.user.steamId}`,
      email: `${oauthData.user.username}@steam.com`,
      name: oauthData.user.displayName,
      picture: oauthData.user.avatar
    };

    // Nettoyer le cookie après récupération
    res.clearCookie('oauth_steam_data');

    res.json({
      success: true,
      user: userData,
      access_token: oauthData.tokens.access_token,
      provider: 'steam',
      steam_specific: {
        steam_id: oauthData.user.steamId,
        username: oauthData.user.username,
        real_name: oauthData.user.realName,
        country: 'FR',
        status: 'online',
        profile_url: `https://steamcommunity.com/profiles/${oauthData.user.steamId}`
      }
    });
  } catch (error) {
    console.error('Erreur lors du parsing des données OAuth Steam:', error);
    res.status(500).json({
      success: false,
      error: 'Données OAuth Steam invalides',
      code: 'OAUTH_ERROR'
    });
  }
}));

// ===== ROUTES GÉNÉRALES OAUTH =====

// Configuration OAuth
router.get('/config', (req, res) => {
  res.json({
    success: true,
    config: {
      google: {
        auth_url: '/api/oauth/google',
        client_id: process.env.GOOGLE_CLIENT_ID,
        scope: ['profile', 'email']
      },
      steam: {
        auth_url: '/api/oauth/steam'
      }
    }
  });
});

// Déconnexion OAuth
router.post('/logout', asyncHandler(async (req, res) => {
  const { provider } = req.body;
  
  if (provider === 'google') {
    res.clearCookie('oauth_google_data');
  } else if (provider === 'steam') {
    res.clearCookie('oauth_steam_data');
  }

  res.json({
    success: true,
    message: `Déconnexion ${provider} réussie`
  });
}));

module.exports = router;
