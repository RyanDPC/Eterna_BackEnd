import { IsString, MinLength, IsOptional, ValidateIf, IsEmail } from 'class-validator';

export class LoginDto {
  @ValidateIf(o => !o.username)
  @IsEmail({}, { message: 'Adresse email invalide' })
  email?: string;

  @ValidateIf(o => !o.email)
  @IsString()
  @MinLength(3, { message: 'Le nom d\'utilisateur doit contenir au moins 3 caractères' })
  username?: string;

  @IsString()
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
  password: string;

  @IsOptional()
  @IsString()
  deviceInfo?: string; // JSON string avec infos sur l'appareil
}
