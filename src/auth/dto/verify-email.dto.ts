import { IsEmail, IsString, Length } from 'class-validator';

export class VerifyEmailDto {
  @IsEmail({}, { message: 'Adresse email invalide' })
  email: string;

  @IsString()
  @Length(6, 6, { message: 'Le code de vérification doit contenir exactement 6 chiffres' })
  code: string;
}

export class ResendVerificationDto {
  @IsEmail({}, { message: 'Adresse email invalide' })
  email: string;
}
