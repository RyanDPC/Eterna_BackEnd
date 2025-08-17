import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

// 🌸 Utilisateur temporaire en mémoire
interface TempUser {
  id: string;
  username: string;
  email: string;
  password: string;
  avatar?: string;
  status: string;
  createdAt: Date;
}

@Injectable()
export class AuthService {
  private users: TempUser[] = [];
  private userCounter = 1;

  constructor(private jwtService: JwtService) {
    // 🌸 Créer un utilisateur de test
    this.users.push({
      id: '1',
      username: 'testuser',
      email: 'test@eterna.com',
      password: 'password123', // En production, ce serait hashé
      status: 'En ligne',
      createdAt: new Date(),
    });
  }

  // 🌸 Validation d'un utilisateur (par username ou email)
  async validateUser(identifier: string, password: string): Promise<any> {
    console.log('🔍 Recherche utilisateur avec identifier:', identifier);
    console.log('👥 Utilisateurs disponibles:', this.users.map(u => ({ username: u.username, email: u.email })));
    
    // Recherche par username OU email
    const user = this.users.find(u => 
      u.username.toLowerCase() === identifier.toLowerCase() || 
      u.email.toLowerCase() === identifier.toLowerCase()
    );
    
    console.log('🎯 Utilisateur trouvé:', user ? { username: user.username, email: user.email } : 'AUCUN');
    
    if (user && user.password === password) {
      console.log('🔑 Mot de passe correct');
      const { password, ...result } = user;
      return result;
    }
    
    if (user) {
      console.log('❌ Mot de passe incorrect');
    } else {
      console.log('❌ Aucun utilisateur trouvé avec cet identifiant');
    }
    return null;
  }

  // 🌸 Connexion
  async login(loginDto: LoginDto) {
    console.log('🔐 Tentative de connexion avec:', loginDto);
    
    const user = await this.validateUser(loginDto.username, loginDto.password);
    console.log('👤 Utilisateur trouvé:', user ? 'OUI' : 'NON');
    
    if (!user) {
      console.log('❌ Identifiants invalides');
      throw new UnauthorizedException('Identifiants invalides');
    }

    const payload = { username: user.username, sub: user.id };
    console.log('✅ Connexion réussie pour:', user.username);
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        status: user.status,
      },
    };
  }

  // 🌸 Inscription
  async register(registerDto: RegisterDto) {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = this.users.find(
      u => u.username === registerDto.username || u.email === registerDto.email
    );
    if (existingUser) {
      throw new UnauthorizedException('Utilisateur déjà existant');
    }

    // Créer le nouvel utilisateur
    const newUser: TempUser = {
      id: (++this.userCounter).toString(),
      username: registerDto.username,
      email: registerDto.email,
      password: registerDto.password, // En production, ce serait hashé
      status: 'En ligne',
      createdAt: new Date(),
    };

    this.users.push(newUser);

    // Générer le token
    const payload = { username: newUser.username, sub: newUser.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        status: newUser.status,
      },
    };
  }

  // 🌸 Récupérer un utilisateur par ID
  async findById(id: string): Promise<any> {
    const user = this.users.find(u => u.id === id);
    if (user) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  // 🌸 Récupérer un utilisateur par nom d'utilisateur
  async findByUsername(username: string): Promise<any> {
    const user = this.users.find(u => u.username === username);
    if (user) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }
}
