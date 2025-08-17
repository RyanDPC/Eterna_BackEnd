import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Nom d\'utilisateur ou email',
    example: 'testuser ou test@eterna.com',
  })
  @IsString()
  @IsNotEmpty()
  username: string; // Peut contenir un username ou un email

  @ApiProperty({
    description: 'Mot de passe',
    example: 'password123',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
