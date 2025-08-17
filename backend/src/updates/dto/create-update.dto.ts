import { IsString, IsUrl, IsNumber, IsBoolean, IsOptional, IsDateString } from 'class-validator';

export class CreateUpdateDto {
  @IsString()
  version: string;

  @IsDateString()
  releaseDate: Date;

  @IsString()
  releaseNotes: string;

  @IsUrl()
  downloadUrl: string;

  @IsNumber()
  fileSize: number;

  @IsBoolean()
  isMandatory: boolean;

  @IsOptional()
  @IsString()
  minVersion?: string;
}
