const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding de la base de données...');

  // Nettoyer la base de données
  await prisma.refreshToken.deleteMany();
  await prisma.pinnedMessage.deleteMany();
  await prisma.message.deleteMany();
  await prisma.roomMember.deleteMany();
  await prisma.room.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.socialAccount.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Base de données nettoyée');

  // Créer des utilisateurs de test
  const hashedPassword = await bcrypt.hash('password123', 12);

  const user1 = await prisma.user.create({
    data: {
      email: 'admin@eterna.com',
      username: 'admin',
      password: hashedPassword,
      isEmailVerified: true,
      avatar: 'https://via.placeholder.com/150/FF6B6B/FFFFFF?text=A',
      bio: 'Administrateur principal d\'ETERNAL',
      profile: {
        create: {
          firstName: 'Admin',
          lastName: 'Eternal',
          phone: '+33123456789',
          location: 'Paris, France',
          website: 'https://eterna.com'
        }
      }
    }
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'moderator@eterna.com',
      username: 'moderator',
      password: hashedPassword,
      isEmailVerified: true,
      avatar: 'https://via.placeholder.com/150/4ECDC4/FFFFFF?text=M',
      bio: 'Modérateur de la communauté',
      profile: {
        create: {
          firstName: 'Mod',
          lastName: 'Erator',
          location: 'Lyon, France'
        }
      }
    }
  });

  const user3 = await prisma.user.create({
    data: {
      email: 'user@eterna.com',
      username: 'user',
      password: hashedPassword,
      isEmailVerified: true,
      avatar: 'https://via.placeholder.com/150/45B7D1/FFFFFF?text=U',
      bio: 'Membre de la communauté',
      profile: {
        create: {
          firstName: 'User',
          lastName: 'Eternal',
          location: 'Marseille, France'
        }
      }
    }
  });

  const user4 = await prisma.user.create({
    data: {
      email: 'gamer@eterna.com',
      username: 'gamer',
      password: hashedPassword,
      isEmailVerified: true,
      avatar: 'https://via.placeholder.com/150/96CEB4/FFFFFF?text=G',
      bio: 'Passionné de jeux vidéo',
      profile: {
        create: {
          firstName: 'Gamer',
          lastName: 'Pro',
          location: 'Toulouse, France'
        }
      }
    }
  });

  console.log('👥 Utilisateurs créés');

  // Créer des équipes
  const team1 = await prisma.team.create({
    data: {
      name: 'Équipe Principale',
      description: 'L\'équipe principale d\'ETERNAL',
      isPublic: true,
      avatar: 'https://via.placeholder.com/150/FF6B6B/FFFFFF?text=EP',
      ownerId: user1.id,
      members: {
        create: [
          { userId: user1.id, role: 'OWNER' },
          { userId: user2.id, role: 'ADMIN' },
          { userId: user3.id, role: 'MEMBER' }
        ]
      }
    }
  });

  const team2 = await prisma.team.create({
    data: {
      name: 'Gamers United',
      description: 'Communauté de joueurs passionnés',
      isPublic: true,
      avatar: 'https://via.placeholder.com/150/4ECDC4/FFFFFF?text=GU',
      ownerId: user4.id,
      members: {
        create: [
          { userId: user4.id, role: 'OWNER' },
          { userId: user3.id, role: 'MEMBER' }
        ]
      }
    }
  });

  console.log('🏆 Équipes créées');

  // Créer des salons
  const room1 = await prisma.room.create({
    data: {
      name: 'général',
      description: 'Salon général pour tous les membres',
      isPrivate: false,
      isDirect: false,
      maxMembers: 1000,
      teamId: team1.id,
      ownerId: user1.id,
      members: {
        create: [
          { userId: user1.id, role: 'OWNER' },
          { userId: user2.id, role: 'ADMIN' },
          { userId: user3.id, role: 'MEMBER' }
        ]
      }
    }
  });

  const room2 = await prisma.room.create({
    data: {
      name: 'annonces',
      description: 'Salon des annonces importantes',
      isPrivate: false,
      isDirect: false,
      maxMembers: 1000,
      teamId: team1.id,
      ownerId: user1.id,
      members: {
        create: [
          { userId: user1.id, role: 'OWNER' },
          { userId: user2.id, role: 'ADMIN' }
        ]
      }
    }
  });

  const room3 = await prisma.room.create({
    data: {
      name: 'gaming',
      description: 'Discussion sur les jeux vidéo',
      isPrivate: false,
      isDirect: false,
      maxMembers: 500,
      teamId: team2.id,
      ownerId: user4.id,
      members: {
        create: [
          { userId: user4.id, role: 'OWNER' },
          { userId: user3.id, role: 'MEMBER' }
        ]
      }
    }
  });

  console.log('🏠 Salons créés');

  // Créer des messages
  const message1 = await prisma.message.create({
    data: {
      content: 'Bienvenue sur ETERNAL ! 🎉',
      type: 'TEXT',
      userId: user1.id,
      roomId: room1.id
    }
  });

  const message2 = await prisma.message.create({
    data: {
      content: 'Merci pour l\'accueil ! 😊',
      type: 'TEXT',
      userId: user3.id,
      roomId: room1.id
    }
  });

  const message3 = await prisma.message.create({
    data: {
      content: 'Quelqu\'un joue à League of Legends ? 🎮',
      type: 'TEXT',
      userId: user4.id,
      roomId: room3.id
    }
  });

  const message4 = await prisma.message.create({
    data: {
      content: 'Oui ! Moi aussi ! 🎯',
      type: 'TEXT',
      userId: user3.id,
      roomId: room3.id,
      replyToId: message3.id
    }
  });

  console.log('💬 Messages créés');

  // Épingler un message important
  await prisma.pinnedMessage.create({
    data: {
      messageId: message1.id,
      roomId: room1.id,
      pinnedBy: user1.id
    }
  });

  console.log('📌 Message épinglé');

  // Créer des comptes sociaux d'exemple
  await prisma.socialAccount.create({
    data: {
      userId: user1.id,
      provider: 'GOOGLE',
      providerId: 'google_123456789',
      email: 'admin@eterna.com',
      name: 'Admin Eternal',
      avatar: 'https://via.placeholder.com/150/FF6B6B/FFFFFF?text=AG'
    }
  });

  await prisma.socialAccount.create({
    data: {
      userId: user4.id,
      provider: 'STEAM',
      providerId: 'steam_76561199055951248',
      name: 'GamerPro',
      avatar: 'https://via.placeholder.com/150/96CEB4/FFFFFF?text=GS'
    }
  });

  console.log('🌐 Comptes sociaux créés');

  // Créer des permissions d'exemple
  await prisma.userPermission.create({
    data: {
      userId: user1.id,
      permission: 'MANAGE_USERS',
      granted: true,
      grantedBy: user1.id
    }
  });

  await prisma.userPermission.create({
    data: {
      userId: user1.id,
      permission: 'VIEW_AUDIT_LOGS',
      granted: true,
      grantedBy: user1.id
    }
  });

  await prisma.userPermission.create({
    data: {
      userId: user2.id,
      permission: 'MANAGE_ROLES',
      granted: true,
      grantedBy: user1.id
    }
  });

  console.log('🔑 Permissions créées');

  console.log('✅ Seeding terminé avec succès !');
  console.log('\n📊 Résumé :');
  console.log(`- ${await prisma.user.count()} utilisateurs créés`);
  console.log(`- ${await prisma.team.count()} équipes créées`);
  console.log(`- ${await prisma.room.count()} salons créés`);
  console.log(`- ${await prisma.message.count()} messages créés`);
  console.log(`- ${await prisma.socialAccount.count()} comptes sociaux créés`);
  console.log(`- ${await prisma.userPermission.count()} permissions créées`);

  console.log('\n🔑 Comptes de test :');
  console.log('admin@eterna.com / password123 (Admin)');
  console.log('moderator@eterna.com / password123 (Modérateur)');
  console.log('user@eterna.com / password123 (Utilisateur)');
  console.log('gamer@eterna.com / password123 (Gamer)');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
