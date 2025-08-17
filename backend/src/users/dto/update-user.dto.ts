import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum UserStatus {
  ONLINE = 'ONLINE',
  AWAY = 'AWAY',
  DO_NOT_DISTURB = 'DO_NOT_DISTURB',
  OFFLINE = 'OFFLINE',
}

export class UpdateUserDto {
  @ApiProperty({
    description: 'Nom d\'utilisateur (optionnel)',
    example: 'newusername',
    required: false,
  })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({
    description: 'Avatar (optionnel)',
    example: 'https://example.com/new-avatar.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({
    description: 'Statut utilisateur (optionnel)',
    enum: UserStatus,
    example: UserStatus.ONLINE,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
