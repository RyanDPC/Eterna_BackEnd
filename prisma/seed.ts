import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Initialisation de la base de données...');

  // Nettoyer la base de données
  await prisma.message.deleteMany();
  await prisma.roomMember.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.room.deleteMany();
  await prisma.team.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.user.deleteMany();

  // Créer des utilisateurs de test
  const hashedPassword = await bcrypt.hash('password123', 12);

  const user1 = await prisma.user.create({
    data: {
      email: 'admin@eterna.com',
      username: 'admin',
      password: hashedPassword,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
      bio: 'Administrateur principal d\'ETERNA',
      isOnline: true,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'dev@eterna.com',
      username: 'dev',
      password: hashedPassword,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dev',
      bio: 'Développeur passionné',
      isOnline: true,
    },
  });

  const user3 = await prisma.user.create({
    data: {
      email: 'designer@eterna.com',
      username: 'designer',
      password: hashedPassword,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=designer',
      bio: 'Designer créatif',
      isOnline: false,
    },
  });

  // Créer des profils utilisateur
  await prisma.userProfile.create({
    data: {
      userId: user1.id,
      firstName: 'Admin',
      lastName: 'ETERNA',
      phone: '+33123456789',
      location: 'Paris, France',
      website: 'https://eterna.com',
      socialLinks: JSON.stringify({
        twitter: '@eterna_admin',
        linkedin: 'admin-eterna',
        github: 'eterna-admin',
      }),
      preferences: JSON.stringify({
        theme: 'dark',
        notifications: true,
        language: 'fr',
      }),
    },
  });

  await prisma.userProfile.create({
    data: {
      userId: user2.id,
      firstName: 'Dev',
      lastName: 'Code',
      phone: '+33987654321',
      location: 'Lyon, France',
      website: 'https://dev-code.dev',
      socialLinks: JSON.stringify({
        twitter: '@dev_code',
        linkedin: 'dev-code',
        github: 'dev-code',
      }),
      preferences: JSON.stringify({
        theme: 'light',
        notifications: true,
        language: 'en',
      }),
    },
  });

  // Créer des équipes
  const team1 = await prisma.team.create({
    data: {
      name: 'Équipe Développement',
      description: 'Équipe principale de développement d\'ETERNA',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=dev-team',
      isPublic: true,
      ownerId: user1.id,
    },
  });

  const team2 = await prisma.team.create({
    data: {
      name: 'Équipe Design',
      description: 'Équipe de design et UX/UI',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=design-team',
      isPublic: true,
      ownerId: user3.id,
    },
  });

  // Ajouter des membres aux équipes
  await prisma.teamMember.create({
    data: {
      userId: user1.id,
      teamId: team1.id,
      role: 'OWNER',
    },
  });

  await prisma.teamMember.create({
    data: {
      userId: user2.id,
      teamId: team1.id,
      role: 'ADMIN',
    },
  });

  await prisma.teamMember.create({
    data: {
      userId: user3.id,
      teamId: team1.id,
      role: 'MEMBER',
    },
  });

  await prisma.teamMember.create({
    data: {
      userId: user3.id,
      teamId: team2.id,
      role: 'OWNER',
    },
  });

  await prisma.teamMember.create({
    data: {
      userId: user1.id,
      teamId: team2.id,
      role: 'MEMBER',
    },
  });

  // Créer des salons
  const room1 = await prisma.room.create({
    data: {
      name: 'Général',
      description: 'Salon de discussion général pour toute l\'équipe',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=general-room',
      isPrivate: false,
      isDirect: false,
      maxMembers: 100,
      teamId: team1.id,
      ownerId: user1.id,
    },
  });

  const room2 = await prisma.room.create({
    data: {
      name: 'Développement',
      description: 'Salon dédié aux discussions techniques',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=dev-room',
      isPrivate: false,
      isDirect: false,
      maxMembers: 50,
      teamId: team1.id,
      ownerId: user2.id,
    },
  });

  const room3 = await prisma.room.create({
    data: {
      name: 'Design',
      description: 'Salon pour les discussions de design',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=design-room',
      isPrivate: false,
      isDirect: false,
      maxMembers: 30,
      teamId: team2.id,
      ownerId: user3.id,
    },
  });

  // Ajouter des membres aux salons
  await prisma.roomMember.create({
    data: {
      userId: user1.id,
      roomId: room1.id,
      role: 'OWNER',
    },
  });

  await prisma.roomMember.create({
    data: {
      userId: user2.id,
      roomId: room1.id,
      role: 'MEMBER',
    },
  });

  await prisma.roomMember.create({
    data: {
      userId: user3.id,
      roomId: room1.id,
      role: 'MEMBER',
    },
  });

  await prisma.roomMember.create({
    data: {
      userId: user2.id,
      roomId: room2.id,
      role: 'OWNER',
    },
  });

  await prisma.roomMember.create({
    data: {
      userId: user1.id,
      roomId: room2.id,
      role: 'MEMBER',
    },
  });

  await prisma.roomMember.create({
    data: {
      userId: user3.id,
      roomId: room3.id,
      role: 'OWNER',
    },
  });

  await prisma.roomMember.create({
    data: {
      userId: user1.id,
      roomId: room3.id,
      role: 'MEMBER',
    },
  });

  // Créer des messages
  const message1 = await prisma.message.create({
    data: {
      content: 'Bienvenue dans le salon général ! 👋',
      type: 'TEXT',
      userId: user1.id,
      roomId: room1.id,
    },
  });

  const message2 = await prisma.message.create({
    data: {
      content: 'Salut tout le monde ! Ravi de rejoindre l\'équipe !',
      type: 'TEXT',
      userId: user2.id,
      roomId: room1.id,
    },
  });

  const message3 = await prisma.message.create({
    data: {
      content: 'Bonjour ! Je suis le designer de l\'équipe 🎨',
      type: 'TEXT',
      userId: user3.id,
      roomId: room1.id,
    },
  });

  const message4 = await prisma.message.create({
    data: {
      content: 'Quelqu\'un a des questions sur le développement ?',
      type: 'TEXT',
      userId: user2.id,
      roomId: room2.id,
    },
  });

  const message5 = await prisma.message.create({
    data: {
      content: 'Oui, j\'ai une question sur l\'architecture !',
      type: 'TEXT',
      userId: user1.id,
      roomId: room2.id,
      replyToId: message4.id,
    },
  });

  console.log('✅ Base de données initialisée avec succès');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors de l\'initialisation:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
