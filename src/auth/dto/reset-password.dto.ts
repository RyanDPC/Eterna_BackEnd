import { IsEmail, IsString, MinLength, Matches } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Adresse email invalide' })
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, { message: 'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre' })
  newPassword: string;

  @IsString()
  @MinLength(8, { message: 'La confirmation du mot de passe doit contenir au moins 8 caractères' })
  confirmPassword: string;
}

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, { message: 'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre' })
  newPassword: string;

  @IsString()
  @MinLength(8, { message: 'La confirmation du mot de passe doit contenir au moins 8 caractères' })
  confirmPassword: string;
}
