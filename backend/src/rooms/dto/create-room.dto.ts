import { IsString, IsOptional, IsBoolean, IsNumber, IsIn, Min, Max, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoomDto {
  @ApiProperty({
    description: 'Nom du salon',
    example: 'mon-salon',
    minLength: 3,
    maxLength: 30,
  })
  @IsString()
  @Length(3, 30)
  name: string;

  @ApiPropertyOptional({
    description: 'Description du salon',
    example: 'Un salon pour discuter de...',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @Max(200)
  description?: string;

  @ApiPropertyOptional({
    description: 'Si le salon est privé',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @ApiPropertyOptional({
    description: 'Si le salon est vocal',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isVoice?: boolean;

  @ApiPropertyOptional({
    description: 'Nombre maximum de membres',
    example: 50,
    minimum: 2,
    maximum: 1000,
  })
  @IsOptional()
  @IsNumber()
  @Min(2)
  @Max(1000)
  maxMembers?: number;
}
