import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional, IsUrl } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'Email de l\'utilisateur',
    example: 'user@eterna.com',
  })
  @IsEmail({}, { message: 'Format d\'email invalide' })
  email: string;

  @ApiProperty({
    description: 'Nom d\'utilisateur unique',
    example: 'john_doe',
    minLength: 3,
  })
  @IsString({ message: 'Le nom d\'utilisateur doit être une chaîne de caractères' })
  @MinLength(3, { message: 'Le nom d\'utilisateur doit contenir au moins 3 caractères' })
  username: string;

  @ApiProperty({
    description: 'Mot de passe',
    example: 'password123',
    minLength: 6,
  })
  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères' })
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
  password: string;

  @ApiPropertyOptional({
    description: 'Avatar de l\'utilisateur (URL)',
    example: 'https://example.com/avatar.jpg',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Format d\'URL invalide pour l\'avatar' })
  avatar?: string;

  @ApiPropertyOptional({
    description: 'Biographie de l\'utilisateur',
    example: 'Développeur passionné par les nouvelles technologies',
  })
  @IsOptional()
  @IsString({ message: 'La biographie doit être une chaîne de caractères' })
  bio?: string;

  @ApiPropertyOptional({
    description: 'Prénom de l\'utilisateur',
    example: 'John',
  })
  @IsOptional()
  @IsString({ message: 'Le prénom doit être une chaîne de caractères' })
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Nom de famille de l\'utilisateur',
    example: 'Doe',
  })
  @IsOptional()
  @IsString({ message: 'Le nom de famille doit être une chaîne de caractères' })
  lastName?: string;
}
