import { IsString, IsNotEmpty, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
}

export class CreateMessageDto {
  @ApiProperty({
    description: 'Contenu du message',
    example: 'Salut tout le monde ! 👋',
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content: string;

  @ApiProperty({
    description: 'ID du salon',
    example: 'room_123',
  })
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @ApiPropertyOptional({
    description: 'Type de message',
    enum: MessageType,
    default: MessageType.TEXT,
  })
  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType = MessageType.TEXT;

  @ApiPropertyOptional({
    description: 'URL de la pièce jointe (pour les images, fichiers, etc.)',
    example: 'https://example.com/file.jpg',
  })
  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}
