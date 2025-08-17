import { IsString, IsEmail, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class SocialAuthDto {
  @IsString()
  @IsNotEmpty({ message: 'Le token d\'accès est requis' })
  accessToken: string;

  @IsString()
  @IsIn(['google', 'apple', 'steam'], { message: 'Provider non supporté' })
  provider: 'google' | 'apple' | 'steam';

  @IsOptional()
  @IsString()
  idToken?: string; // Pour Apple et Google

  @IsOptional()
  @IsString()
  deviceInfo?: string; // JSON string avec infos sur l'appareil
}

export class LinkSocialAccountDto {
  @IsString()
  @IsNotEmpty({ message: 'Le token d\'accès est requis' })
  accessToken: string;

  @IsString()
  @IsIn(['google', 'apple', 'steam'], { message: 'Provider non supporté' })
  provider: 'google' | 'apple' | 'steam';

  @IsOptional()
  @IsString()
  idToken?: string;
}

export class UnlinkSocialAccountDto {
  @IsString()
  @IsIn(['google', 'apple', 'steam'], { message: 'Provider non supporté' })
  provider: 'google' | 'apple' | 'steam';
}
