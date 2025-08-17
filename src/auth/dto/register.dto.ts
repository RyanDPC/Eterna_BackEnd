import { IsEmail, IsString, MinLength, IsOptional, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Adresse email invalide' })
  email: string;

  @IsString()
  @MinLength(3, { message: 'Le nom d\'utilisateur doit contenir au moins 3 caractères' })
  @Matches(/^[a-zA-Z0-9_-]+$/, { message: 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores' })
  username: string;

  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, { message: 'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre' })
  password: string;

  @IsString()
  @MinLength(8, { message: 'La confirmation du mot de passe doit contenir au moins 8 caractères' })
  confirmPassword: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  bio?: string;
}
