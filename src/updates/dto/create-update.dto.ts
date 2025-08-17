import { IsString, IsOptional, IsBoolean, IsNumber, IsUrl } from 'class-validator';

export class CreateUpdateDto {
  @IsString()
  version: string;

  @IsString()
  releaseNotes: string;

  @IsUrl()
  downloadUrl: string;

  @IsNumber()
  fileSize: number;

  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;

  @IsOptional()
  @IsString()
  minVersion?: string;
}
