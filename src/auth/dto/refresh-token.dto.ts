import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty({ message: 'Le refresh token est requis' })
  refreshToken: string;

  @IsOptional()
  @IsString()
  deviceInfo?: string; // JSON string avec infos sur l'appareil
}

export class LogoutDto {
  @IsString()
  @IsNotEmpty({ message: 'Le refresh token est requis' })
  refreshToken: string;
}

export class LogoutAllDto {
  @IsOptional()
  @IsString()
  excludeCurrentSession?: string; // token de la session actuelle à exclure
}
