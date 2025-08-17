import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, MinLength, MaxLength } from 'class-validator';

export class CreateTeamDto {
  @ApiProperty({
    description: 'Nom de l\'équipe',
    example: 'Équipe Développement',
    minLength: 2,
    maxLength: 100,
  })
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
  @MaxLength(100, { message: 'Le nom ne peut pas dépasser 100 caractères' })
  name: string;

  @ApiPropertyOptional({
    description: 'Description de l\'équipe',
    example: 'Équipe dédiée au développement des applications web',
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'La description doit être une chaîne de caractères' })
  @MaxLength(500, { message: 'La description ne peut pas dépasser 500 caractères' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Avatar de l\'équipe (URL)',
    example: 'https://example.com/team-avatar.jpg',
  })
  @IsOptional()
  @IsString({ message: 'L\'avatar doit être une chaîne de caractères' })
  avatar?: string;

  @ApiPropertyOptional({
    description: 'L\'équipe est-elle publique ?',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Le statut public doit être un booléen' })
  isPublic?: boolean;
}
