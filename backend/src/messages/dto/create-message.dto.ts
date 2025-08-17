import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, MinLength, MaxLength } from 'class-validator';

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
  SYSTEM = 'SYSTEM',
}

export class CreateMessageDto {
  @ApiProperty({
    description: 'Contenu du message',
    example: 'Bonjour tout le monde !',
    minLength: 1,
    maxLength: 2000,
  })
  @IsString({ message: 'Le contenu doit être une chaîne de caractères' })
  @MinLength(1, { message: 'Le contenu ne peut pas être vide' })
  @MaxLength(2000, { message: 'Le contenu ne peut pas dépasser 2000 caractères' })
  content: string;

  @ApiProperty({
    description: 'ID du salon où envoyer le message',
    example: 'room_123',
  })
  @IsString({ message: 'L\'ID du salon doit être une chaîne de caractères' })
  roomId: string;

  @ApiPropertyOptional({
    description: 'Type de message',
    enum: MessageType,
    example: MessageType.TEXT,
    default: MessageType.TEXT,
  })
  @IsOptional()
  @IsEnum(MessageType, { message: 'Type de message invalide' })
  type?: MessageType;

  @ApiPropertyOptional({
    description: 'ID du message auquel répondre',
    example: 'msg_456',
  })
  @IsOptional()
  @IsString({ message: 'L\'ID du message de réponse doit être une chaîne de caractères' })
  replyToId?: string;

  @ApiPropertyOptional({
    description: 'ID du message parent (pour les threads)',
    example: 'msg_789',
  })
  @IsOptional()
  @IsString({ message: 'L\'ID du message parent doit être une chaîne de caractères' })
  parentId?: string;

  @ApiPropertyOptional({
    description: 'Métadonnées du message (JSON stringifié)',
    example: '{"fileSize": 1024, "mimeType": "image/jpeg"}',
  })
  @IsOptional()
  @IsString({ message: 'Les métadonnées doivent être une chaîne de caractères' })
  metadata?: string;
}
