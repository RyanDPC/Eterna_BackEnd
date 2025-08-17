import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNumber, MinLength, MaxLength, Min, Max } from 'class-validator';

export class CreateRoomDto {
  @ApiProperty({
    description: 'Nom du salon',
    example: 'Général',
    minLength: 2,
    maxLength: 100,
  })
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
  @MaxLength(100, { message: 'Le nom ne peut pas dépasser 100 caractères' })
  name: string;

  @ApiPropertyOptional({
    description: 'Description du salon',
    example: 'Salon de discussion général pour toute l\'équipe',
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'La description doit être une chaîne de caractères' })
  @MaxLength(500, { message: 'La description ne peut pas dépasser 500 caractères' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Avatar du salon (URL)',
    example: 'https://example.com/room-avatar.jpg',
  })
  @IsOptional()
  @IsString({ message: 'L\'avatar doit être une chaîne de caractères' })
  avatar?: string;

  @ApiPropertyOptional({
    description: 'Le salon est-il privé ?',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Le statut privé doit être un booléen' })
  isPrivate?: boolean;

  @ApiPropertyOptional({
    description: 'Le salon est-il un salon direct (DM) ?',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Le statut direct doit être un booléen' })
  isDirect?: boolean;

  @ApiPropertyOptional({
    description: 'Nombre maximum de membres',
    example: 100,
    default: 100,
    minimum: 2,
    maximum: 1000,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Le nombre maximum de membres doit être un nombre' })
  @Min(2, { message: 'Le salon doit pouvoir accueillir au moins 2 membres' })
  @Max(1000, { message: 'Le salon ne peut pas accueillir plus de 1000 membres' })
  maxMembers?: number;

  @ApiPropertyOptional({
    description: 'ID de l\'équipe associée au salon',
    example: 'team_123',
  })
  @IsOptional()
  @IsString({ message: 'L\'ID de l\'équipe doit être une chaîne de caractères' })
  teamId?: string;
}
