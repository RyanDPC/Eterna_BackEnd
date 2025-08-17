import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding de la base de données SQLite...');

  // Nettoyage de la base de données
  console.log('🧹 Nettoyage de la base de données...');
  await prisma.pinnedMessage.deleteMany();
  await prisma.message.deleteMany();
  await prisma.roomMember.deleteMany();
  await prisma.room.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.user.deleteMany();

  // Création des utilisateurs de test
  console.log('👥 Création des utilisateurs...');
  
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@eterna.com',
      username: 'admin',
      password: hashedPassword,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
      bio: 'Administrateur principal d\'ETERNA',
      isOnline: true,
      profile: {
        create: {
          firstName: 'Admin',
          lastName: 'ETERNA',
          location: 'Paris, France',
          website: 'https://eterna.com',
          socialLinks: JSON.stringify({
            twitter: '@eterna_admin',
            linkedin: 'admin-eterna'
          }),
          preferences: JSON.stringify({
            theme: 'dark',
            language: 'fr',
            notifications: true
          })
        }
      }
    }
  });

  const user1 = await prisma.user.create({
    data: {
      email: 'alice@eterna.com',
      username: 'alice',
      password: hashedPassword,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
      bio: 'Développeuse passionnée',
      isOnline: true,
      profile: {
        create: {
          firstName: 'Alice',
          lastName: 'Dupont',
          location: 'Lyon, France',
          socialLinks: JSON.stringify({
            github: 'alice-dev',
            linkedin: 'alice-dupont'
          }),
          preferences: JSON.stringify({
            theme: 'light',
            language: 'fr',
            notifications: true
          })
        }
      }
    }
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'bob@eterna.com',
      username: 'bob',
      password: hashedPassword,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
      bio: 'Designer créatif',
      isOnline: false,
      profile: {
        create: {
          firstName: 'Bob',
          lastName: 'Martin',
          location: 'Marseille, France',
          socialLinks: JSON.stringify({
            behance: 'bob-design',
            dribbble: 'bobmartin'
          }),
          preferences: JSON.stringify({
            theme: 'dark',
            language: 'en',
            notifications: false
          })
        }
      }
    }
  });

  const user3 = await prisma.user.create({
    data: {
      email: 'charlie@eterna.com',
      username: 'charlie',
      password: hashedPassword,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlie',
      bio: 'Product Manager',
      isOnline: true,
      profile: {
        create: {
          firstName: 'Charlie',
          lastName: 'Wilson',
          location: 'Toulouse, France',
          socialLinks: JSON.stringify({
            linkedin: 'charlie-wilson-pm'
          }),
          preferences: JSON.stringify({
            theme: 'auto',
            language: 'fr',
            notifications: true
          })
        }
      }
    }
  });

  console.log('✅ Utilisateurs créés:', { adminUser, user1, user2, user3 });

  // Création des équipes
  console.log('🏢 Création des équipes...');
  
  const team1 = await prisma.team.create({
    data: {
      name: 'Équipe Développement',
      description: 'Équipe principale de développement d\'ETERNA',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=dev-team',
      isPublic: true,
      ownerId: adminUser.id
    }
  });

  const team2 = await prisma.team.create({
    data: {
      name: 'Équipe Design',
      description: 'Équipe de design et UX/UI',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=design-team',
      isPublic: true,
      ownerId: user2.id
    }
  });

  const team3 = await prisma.team.create({
    data: {
      name: 'Équipe Produit',
      description: 'Équipe de gestion de produit',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=product-team',
      isPublic: false,
      ownerId: user3.id
    }
  });

  console.log('✅ Équipes créées:', { team1, team2, team3 });

  // Ajout des membres aux équipes
  console.log('👥 Ajout des membres aux équipes...');
  
  await prisma.teamMember.createMany({
    data: [
      // Équipe Développement
      { userId: adminUser.id, teamId: team1.id, role: 'OWNER' },
      { userId: user1.id, teamId: team1.id, role: 'ADMIN' },
      { userId: user3.id, teamId: team1.id, role: 'MEMBER' },
      
      // Équipe Design
      { userId: user2.id, teamId: team2.id, role: 'OWNER' },
      { userId: user1.id, teamId: team2.id, role: 'MEMBER' },
      
      // Équipe Produit
      { userId: user3.id, teamId: team3.id, role: 'OWNER' },
      { userId: adminUser.id, teamId: team3.id, role: 'ADMIN' }
    ]
  });

  console.log('✅ Membres ajoutés aux équipes');

  // Création des salons
  console.log('💬 Création des salons...');
  
  const room1 = await prisma.room.create({
    data: {
      name: 'général',
      description: 'Salon général pour toute l\'équipe',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=general-room',
      isPrivate: false,
      isDirect: false,
      maxMembers: 100,
      teamId: team1.id,
      ownerId: adminUser.id
    }
  });

  const room2 = await prisma.room.create({
    data: {
      name: 'développement',
      description: 'Salon dédié au développement',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=dev-room',
      isPrivate: false,
      isDirect: false,
      maxMembers: 50,
      teamId: team1.id,
      ownerId: user1.id
    }
  });

  const room3 = await prisma.room.create({
    data: {
      name: 'design-ux',
      description: 'Salon pour les discussions design',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=design-room',
      isPrivate: false,
      isDirect: false,
      maxMembers: 30,
      teamId: team2.id,
      ownerId: user2.id
    }
  });

  // Salon privé
  const room4 = await prisma.room.create({
    data: {
      name: 'planning-produit',
      description: 'Salon privé pour la planification produit',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=planning-room',
      isPrivate: true,
      isDirect: false,
      maxMembers: 20,
      teamId: team3.id,
      ownerId: user3.id
    }
  });

  console.log('✅ Salons créés:', { room1, room2, room3, room4 });

  // Ajout des membres aux salons
  console.log('👥 Ajout des membres aux salons...');
  
  await prisma.roomMember.createMany({
    data: [
      // Salon général
      { userId: adminUser.id, roomId: room1.id, role: 'OWNER' },
      { userId: user1.id, roomId: room1.id, role: 'ADMIN' },
      { userId: user2.id, roomId: room1.id, role: 'MEMBER' },
      { userId: user3.id, roomId: room1.id, role: 'MEMBER' },
      
      // Salon développement
      { userId: user1.id, roomId: room2.id, role: 'OWNER' },
      { userId: adminUser.id, roomId: room2.id, role: 'ADMIN' },
      { userId: user3.id, roomId: room2.id, role: 'MEMBER' },
      
      // Salon design
      { userId: user2.id, roomId: room3.id, role: 'OWNER' },
      { userId: user1.id, roomId: room3.id, role: 'MEMBER' },
      
      // Salon planning (privé)
      { userId: user3.id, roomId: room4.id, role: 'OWNER' },
      { userId: adminUser.id, roomId: room4.id, role: 'ADMIN' }
    ]
  });

  console.log('✅ Membres ajoutés aux salons');

  // Création des messages
  console.log('💬 Création des messages...');
  
  const message1 = await prisma.message.create({
    data: {
      content: 'Bienvenue dans le salon général d\'ETERNA ! 🎉',
      type: 'TEXT',
      userId: adminUser.id,
      roomId: room1.id
    }
  });

  const message2 = await prisma.message.create({
    data: {
      content: 'Salut tout le monde ! Ravi de rejoindre l\'équipe 😊',
      type: 'TEXT',
      userId: user1.id,
      roomId: room1.id
    }
  });

  const message3 = await prisma.message.create({
    data: {
      content: 'Bonjour ! Je suis Charlie, le nouveau PM. Heureux de travailler avec vous !',
      type: 'TEXT',
      userId: user3.id,
      roomId: room1.id
    }
  });

  const message4 = await prisma.message.create({
    data: {
      content: 'Quelqu\'un a des questions sur la nouvelle interface ?',
      type: 'TEXT',
      userId: user2.id,
      roomId: room3.id
    }
  });

  const message5 = await prisma.message.create({
    data: {
      content: 'Oui, j\'aimerais discuter de l\'UX du dashboard !',
      type: 'TEXT',
      userId: user1.id,
      roomId: room3.id
    }
  });

  console.log('✅ Messages créés:', { message1, message2, message3, message4, message5 });

  // Création d'invitations
  console.log('📧 Création d\'invitations...');
  
  const invitation1 = await prisma.invitation.create({
    data: {
      email: 'newdev@eterna.com',
      teamId: team1.id,
      role: 'MEMBER',
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
      senderId: adminUser.id
    }
  });

  const invitation2 = await prisma.invitation.create({
    data: {
      email: 'designer@eterna.com',
      teamId: team2.id,
      role: 'MEMBER',
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
      senderId: user2.id
    }
  });

  console.log('✅ Invitations créées:', { invitation1, invitation2 });

  // Message épinglé
  console.log('📌 Épinglage d\'un message...');
  
  await prisma.pinnedMessage.create({
    data: {
      messageId: message1.id,
      roomId: room1.id,
      pinnedBy: adminUser.id
    }
  });

  console.log('✅ Message épinglé');

  console.log('🎉 Seeding terminé avec succès !');
  console.log('\n📊 Résumé:');
  console.log(`- ${await prisma.user.count()} utilisateurs créés`);
  console.log(`- ${await prisma.team.count()} équipes créées`);
  console.log(`- ${await prisma.room.count()} salons créés`);
  console.log(`- ${await prisma.message.count()} messages créés`);
  console.log(`- ${await prisma.invitation.count()} invitations créées`);
  
  console.log('\n🔑 Comptes de test:');
  console.log('admin@eterna.com / password123');
  console.log('alice@eterna.com / password123');
  console.log('bob@eterna.com / password123');
  console.log('charlie@eterna.com / password123');
  
  console.log('\n🗄️ Base de données SQLite créée: dev.db');
  console.log('🌐 Serveur: http://localhost:8080');
  console.log('📊 Swagger: http://localhost:8080/api/docs');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
