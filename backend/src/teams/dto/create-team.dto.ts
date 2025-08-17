import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTeamDto {
  @ApiProperty({
    description: 'Nom de l\'équipe',
    example: 'Équipe Développement',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Description de l\'équipe',
    example: 'Équipe principale de développement d\'ETERNA',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'URL de l\'avatar de l\'équipe',
    example: 'https://api.dicebear.com/7.x/identicon/svg?seed=dev-team',
  })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({
    description: 'Si l\'équipe est publique',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
