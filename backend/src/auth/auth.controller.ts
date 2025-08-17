import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Authentification')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Connexion utilisateur' })
  @ApiResponse({
    status: 200,
    description: 'Connexion réussie',
  })
  @ApiResponse({
    status: 401,
    description: 'Identifiants invalides',
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  @ApiOperation({ summary: 'Inscription utilisateur' })
  @ApiResponse({
    status: 201,
    description: 'Inscription réussie',
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
  })
  @ApiResponse({
    status: 409,
    description: 'Utilisateur déjà existant',
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer le profil utilisateur' })
  @ApiResponse({
    status: 200,
    description: 'Profil récupéré',
  })
  @ApiResponse({
    status: 401,
    description: 'Non autorisé',
  })
  async getProfile(@Request() req) {
    const user = await this.authService.findById(req.user.id);
    return { user };
  }
}
