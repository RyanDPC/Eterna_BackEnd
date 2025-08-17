import { IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JoinRoomDto {
  @ApiProperty({
    description: 'ID du salon à rejoindre',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsUUID()
  roomId: string;
}
