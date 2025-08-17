import { UpdateInfo } from './update-info.interface';

export interface UpdateStats {
  totalVersions: number;
  totalDownloads: number;
  totalInstallations: number;
  latestVersion: UpdateInfo | null;
  versionStats: {
    version: string;
    downloads: number;
    installations: number;
    successRate: number;
  }[];
}
