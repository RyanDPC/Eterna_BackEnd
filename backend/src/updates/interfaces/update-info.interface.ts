export interface UpdateInfo {
  version: string;
  releaseDate: Date;
  releaseNotes: string;
  downloadUrl: string;
  fileSize: number;
  isMandatory: boolean;
  minVersion?: string;
  downloads: number;
  installations: number;
}
