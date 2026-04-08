import {
  S3Client,
  S3ClientConfig,
  DeleteObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';
import { IStorageProvider } from '../interfaces/storage-provider.interface';
import {
  StorageDeleteException,
  StorageDownloadException,
  StorageFileNotFoundException,
  StorageListException,
  StorageUploadException,
} from '../exceptions/polystore.exception';

export interface AwsS3ProviderConfig {
  region: string;
  bucket: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  endpoint?: string;
  forcePathStyle?: boolean;
}

export class AwsS3Provider implements IStorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(config: AwsS3ProviderConfig) {
    this.bucket = config.bucket;

    const clientConfig: S3ClientConfig = {
      region: config.region,
    };

    if (config.accessKeyId && config.secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      };
    }

    if (config.endpoint) {
      clientConfig.endpoint = config.endpoint;
    }

    if (config.forcePathStyle !== undefined) {
      clientConfig.forcePathStyle = config.forcePathStyle;
    }

    this.client = new S3Client(clientConfig);
  }

  async upload(
    path: string,
    file: Buffer | NodeJS.ReadableStream,
    mimetype?: string,
  ): Promise<string> {
    try {
      // Using @aws-sdk/lib-storage Upload for handling both Buffer and Streams effectively (including multipart for large files)
      const upload = new Upload({
        client: this.client,
        params: {
          Bucket: this.bucket,
          Key: path,
          Body: file as Buffer | Readable,
          ContentType: mimetype,
        },
      });

      await upload.done();
      return path;
    } catch (error: unknown) {
      const e = error as Error;
      throw new StorageUploadException(e.message || 'Unknown upload error');
    }
  }

  async delete(path: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: path,
      });

      await this.client.send(command);
    } catch (error: unknown) {
      const e = error as Error;
      throw new StorageDeleteException(e.message || 'Unknown delete error');
    }
  }

  async list(
    prefix?: string,
    options?: { limit?: number; cursor?: string },
  ): Promise<{ keys: string[]; continuationToken?: string }> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
        MaxKeys: options?.limit,
        ContinuationToken: options?.cursor,
      });

      const response = await this.client.send(command);

      const keys =
        response.Contents?.map((item) => item.Key as string).filter(Boolean) ||
        [];

      return {
        keys,
        continuationToken: response.NextContinuationToken,
      };
    } catch (error: unknown) {
      const e = error as Error;
      throw new StorageListException(e.message || 'Unknown list error');
    }
  }

  async download(path: string): Promise<NodeJS.ReadableStream> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: path,
      });

      const response = await this.client.send(command);

      if (!response.Body) {
        throw new StorageFileNotFoundException(path);
      }

      // response.Body in Node.js is a Readable stream
      return response.Body as NodeJS.ReadableStream;
    } catch (error: unknown) {
      const e = error as Error & { name?: string };
      if (e.name === 'NoSuchKey' || e.name === 'NotFound') {
        throw new StorageFileNotFoundException(path);
      }
      throw new StorageDownloadException(e.message || 'Unknown download error');
    }
  }
}
