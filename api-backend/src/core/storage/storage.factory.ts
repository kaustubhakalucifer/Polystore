import { IStorageProvider } from '../interfaces/storage-provider.interface';
import { AwsS3Provider, AwsS3ProviderConfig } from './aws-s3.provider';
import {
  AzureStorageProvider,
  AzureStorageProviderConfig,
} from './azure-storage.provider';
import {
  GcpStorageProvider,
  GcpStorageProviderConfig,
} from './gcp-storage.provider';

export enum StorageProviderType {
  AWS_S3 = 'AWS_S3',
  AZURE_BLOB = 'AZURE_BLOB',
  GCP_STORAGE = 'GCP_STORAGE',
}

export interface StorageCredentials {
  type: StorageProviderType;
  config:
    | AwsS3ProviderConfig
    | AzureStorageProviderConfig
    | GcpStorageProviderConfig;
}

export class StorageProviderFactory {
  static create(credentials: StorageCredentials): IStorageProvider {
    switch (credentials.type) {
      case StorageProviderType.AWS_S3:
        return new AwsS3Provider(credentials.config as AwsS3ProviderConfig);
      case StorageProviderType.AZURE_BLOB:
        return new AzureStorageProvider(
          credentials.config as AzureStorageProviderConfig,
        );
      case StorageProviderType.GCP_STORAGE:
        return new GcpStorageProvider(
          credentials.config as GcpStorageProviderConfig,
        );
      default: {
        const exhaustiveCheck: never = credentials.type;
        throw new Error(
          `Unsupported storage provider type: ${String(exhaustiveCheck)}`,
        );
      }
    }
  }
}
