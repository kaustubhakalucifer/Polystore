import { StorageProviderFactory, StorageProviderType } from './storage.factory';
import { AwsS3Provider } from './aws-s3.provider';
import { AzureStorageProvider } from './azure-storage.provider';
import { GcpStorageProvider } from './gcp-storage.provider';

describe('StorageProviderFactory', () => {
  it('should create an AWS S3 provider', () => {
    const provider = StorageProviderFactory.create({
      type: StorageProviderType.AWS_S3,
      config: {
        region: 'us-east-1',
        accessKeyId: 'test',
        secretAccessKey: 'test',
        bucket: 'test-bucket',
      },
    });

    expect(provider).toBeInstanceOf(AwsS3Provider);
  });

  it('should create an Azure Blob Storage provider', () => {
    const provider = StorageProviderFactory.create({
      type: StorageProviderType.AZURE_BLOB,
      config: {
        connectionString: 'UseDevelopmentStorage=true',
        containerName: 'test-container',
      },
    });

    expect(provider).toBeInstanceOf(AzureStorageProvider);
  });

  it('should create a GCP Storage provider', () => {
    const provider = StorageProviderFactory.create({
      type: StorageProviderType.GCP_STORAGE,
      config: {
        projectId: 'test-project',
        credentials: {
          client_email: 'test@example.com',
          private_key: 'test-key',
        },
        bucket: 'test-bucket',
      },
    });

    expect(provider).toBeInstanceOf(GcpStorageProvider);
  });

  it('should throw an error for unsupported provider type', () => {
    expect(() => {
      StorageProviderFactory.create({
        type: 'UNSUPPORTED' as unknown as StorageProviderType,
        config: {} as unknown as never,
      });
    }).toThrow('Unsupported storage provider type: UNSUPPORTED');
  });
});
