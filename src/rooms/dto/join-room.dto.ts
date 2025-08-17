import { IsOptional, IsString } from 'class-validator';

export class JoinRoomDto {
  @IsOptional()
  @IsString()
  role?: string;
}
