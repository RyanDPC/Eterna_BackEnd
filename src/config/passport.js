const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const SteamStrategy = require('passport-steam').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const { ExtractJwt } = require('passport-jwt');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Configuration des stratégies OAuth

// Stratégie Google OAuth
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/oauth/google/callback',
    scope: ['profile', 'email']
  }, async (accessToken, refreshToken, profile, done) => {
  try {
    // Vérifier si l'utilisateur existe déjà
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: profile.emails[0].value },
          {
            socialAccounts: {
              some: {
                provider: 'GOOGLE',
                providerId: profile.id
              }
            }
          }
        ]
      },
      include: {
        socialAccounts: true,
        profile: true
      }
    });

    if (!user) {
      // Créer un nouvel utilisateur
      user = await prisma.user.create({
        data: {
          email: profile.emails[0].value,
          username: profile.emails[0].value.split('@')[0] + '_' + Date.now(),
          isEmailVerified: profile.emails[0].verified,
          avatar: profile.photos[0]?.value,
          profile: {
            create: {
              firstName: profile.name.givenName,
              lastName: profile.name.familyName
            }
          },
          socialAccounts: {
            create: {
              provider: 'GOOGLE',
              providerId: profile.id,
              email: profile.emails[0].value,
              name: profile.displayName,
              avatar: profile.photos[0]?.value,
              accessToken,
              refreshToken
            }
          }
        },
        include: {
          socialAccounts: true,
          profile: true
        }
      });
    } else {
      // Mettre à jour le compte social existant
      const existingSocialAccount = user.socialAccounts.find(
        acc => acc.provider === 'GOOGLE' && acc.providerId === profile.id
      );

      if (existingSocialAccount) {
        await prisma.socialAccount.update({
          where: { id: existingSocialAccount.id },
          data: {
            accessToken,
            refreshToken,
            avatar: profile.photos[0]?.value,
            updatedAt: new Date()
          }
        });
      } else {
        // Ajouter un nouveau compte social
        await prisma.socialAccount.create({
          data: {
            userId: user.id,
            provider: 'GOOGLE',
            providerId: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
            avatar: profile.photos[0]?.value,
            accessToken,
            refreshToken
          }
        });
      }

      // Mettre à jour les informations utilisateur
      await prisma.user.update({
        where: { id: user.id },
        data: {
          avatar: profile.photos[0]?.value,
          isEmailVerified: profile.emails[0].verified,
          updatedAt: new Date()
        }
      });
    }

    return done(null, user);
  } catch (error) {
    console.error('Erreur lors de l\'authentification Google:', error);
    return done(error, null);
  }
  }));
} else {
  console.log('⚠️ Google OAuth non configuré - variables d\'environnement manquantes');
}

// Stratégie Steam OpenID
if (process.env.STEAM_API_KEY) {
  passport.use(new SteamStrategy({
    returnURL: process.env.STEAM_RETURN_URL || '/api/oauth/steam/callback',
    realm: process.env.STEAM_REALM || 'http://localhost:8080/',
    apiKey: process.env.STEAM_API_KEY
  }, async (identifier, profile, done) => {
  try {
    // Vérifier si l'utilisateur existe déjà
    let user = await prisma.user.findFirst({
      where: {
        socialAccounts: {
          some: {
            provider: 'STEAM',
            providerId: profile.id
          }
        }
      },
      include: {
        socialAccounts: true,
        profile: true
      }
    });

    if (!user) {
      // Créer un nouvel utilisateur
      user = await prisma.user.create({
        data: {
          email: `${profile.id}@steam.com`,
          username: profile.displayName || `steam_${profile.id}`,
          avatar: profile._json.avatarfull,
          profile: {
            create: {
              firstName: profile._json.realname || profile.displayName
            }
          },
          socialAccounts: {
            create: {
              provider: 'STEAM',
              providerId: profile.id,
              name: profile.displayName,
              avatar: profile._json.avatarfull
            }
          }
        },
        include: {
          socialAccounts: true,
          profile: true
        }
      });
    } else {
      // Mettre à jour le compte social existant
      await prisma.socialAccount.updateMany({
        where: {
          userId: user.id,
          provider: 'STEAM',
          providerId: profile.id
        },
        data: {
          name: profile.displayName,
          avatar: profile._json.avatarfull,
          updatedAt: new Date()
        }
      });

      // Mettre à jour les informations utilisateur
      await prisma.user.update({
        where: { id: user.id },
        data: {
          username: profile.displayName || user.username,
          avatar: profile._json.avatarfull,
          updatedAt: new Date()
        }
      });
    }

    return done(null, user);
  } catch (error) {
    console.error('Erreur lors de l\'authentification Steam:', error);
    return done(error, null);
  }
  }));
} else {
  console.log('⚠️ Steam OAuth non configuré - variable d\'environnement STEAM_API_KEY manquante');
}

// Stratégie JWT
passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'eterna-jwt-secret-key'
}, async (payload, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        profile: true,
        socialAccounts: true
      }
    });

    if (!user) {
      return done(null, false);
    }

    return done(null, user);
  } catch (error) {
    return done(error, false);
  }
}));

// Stratégie locale (email/password)
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
        socialAccounts: true
      }
    });

    if (!user || !user.password) {
      return done(null, false, { message: 'Email ou mot de passe incorrect' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return done(null, false, { message: 'Email ou mot de passe incorrect' });
    }

    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

// Sérialisation des utilisateurs
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        socialAccounts: true
      }
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
