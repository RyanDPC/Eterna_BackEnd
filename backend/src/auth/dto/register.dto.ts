import { IsString, IsEmail, IsNotEmpty, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'Nom d\'utilisateur',
    example: 'newuser',
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: 'Email de l\'utilisateur',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Mot de passe',
    example: 'password123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    description: 'Avatar de l\'utilisateur',
    example: 'https://example.com/avatar.jpg',
  })
  @IsOptional()
  @IsString()
  avatar?: string;
}
