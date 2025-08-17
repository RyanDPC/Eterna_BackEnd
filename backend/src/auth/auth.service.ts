import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isOnline: true, lastSeen: new Date() },
    });

    const payload = { email: user.email, sub: user.id, username: user.username };
    
    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
        isOnline: true,
        profile: user.profile,
      },
      access_token: this.jwtService.sign(payload),
      refresh_token: this.generateRefreshToken(payload),
    };
  }

  async register(createUserDto: CreateUserDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: createUserDto.email },
          { username: createUserDto.username },
        ],
      },
    });

    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email ou nom d\'utilisateur existe déjà');
    }

    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      parseInt(this.configService.get('BCRYPT_ROUNDS', '12')),
    );

    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        username: createUserDto.username,
        password: hashedPassword,
        avatar: createUserDto.avatar,
        bio: createUserDto.bio,
      },
      include: { profile: true },
    });

    if (createUserDto.firstName || createUserDto.lastName) {
      await this.prisma.userProfile.create({
        data: {
          userId: user.id,
          firstName: createUserDto.firstName,
          lastName: createUserDto.lastName,
        },
      });
    }

    const { password, ...result } = user;
    
    const payload = { email: user.email, sub: user.id, username: user.username };
    
    return {
      user: result,
      access_token: this.jwtService.sign(payload),
      refresh_token: this.generateRefreshToken(payload),
    };
  }

  async refreshToken(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    const payload = { email: user.email, sub: user.id, username: user.username };
    
    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.generateRefreshToken(payload),
    };
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { isOnline: false, lastSeen: new Date() },
    });

    return { message: 'Déconnexion réussie' };
  }

  private generateRefreshToken(payload: any): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '30d'),
    });
  }
}
