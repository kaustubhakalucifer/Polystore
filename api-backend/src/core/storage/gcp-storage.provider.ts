import { Storage, StorageOptions, Bucket } from '@google-cloud/storage';
import { IStorageProvider } from '../interfaces/storage-provider.interface';
import {
  StorageDeleteException,
  StorageDownloadException,
  StorageFileNotFoundException,
  StorageListException,
  StorageUploadException,
} from '../exceptions/polystore.exception';
import { pipeline } from 'stream/promises';

export interface GcpStorageProviderConfig {
  projectId?: string;
  keyFilename?: string;
  credentials?: {
    client_email: string;
    private_key: string;
  };
  bucket: string;
}

export class GcpStorageProvider implements IStorageProvider {
  private readonly storage: Storage;
  private readonly bucket: Bucket;

  constructor(config: GcpStorageProviderConfig) {
    const storageOptions: StorageOptions = {};

    if (config.projectId) {
      storageOptions.projectId = config.projectId;
    }

    if (config.keyFilename) {
      storageOptions.keyFilename = config.keyFilename;
    } else if (config.credentials) {
      storageOptions.credentials = config.credentials;
    }

    this.storage = new Storage(storageOptions);
    this.bucket = this.storage.bucket(config.bucket);
  }

  async upload(
    path: string,
    file: Buffer | NodeJS.ReadableStream,
    mimetype?: string,
  ): Promise<string> {
    try {
      const gcsFile = this.bucket.file(path);
      const options = mimetype ? { contentType: mimetype } : undefined;

      if (Buffer.isBuffer(file)) {
        await gcsFile.save(file, options);
      } else {
        const writeStream = gcsFile.createWriteStream(options);
        // Using pipeline to properly handle stream errors and backpressure
        await pipeline(file, writeStream);
      }

      return path;
    } catch (error: unknown) {
      const e = error as Error;
      throw new StorageUploadException(e.message || 'Unknown upload error');
    }
  }

  async delete(path: string): Promise<void> {
    try {
      const gcsFile = this.bucket.file(path);
      await gcsFile.delete({ ignoreNotFound: true });
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
      const [files, nextQuery] = await this.bucket.getFiles({
        prefix,
        maxResults: options?.limit,
        pageToken: options?.cursor,
      });

      const keys = files.map((file) => file.name);

      return {
        keys,
        continuationToken: nextQuery?.pageToken,
      };
    } catch (error: unknown) {
      const e = error as Error;
      throw new StorageListException(e.message || 'Unknown list error');
    }
  }

  async download(path: string): Promise<NodeJS.ReadableStream> {
    try {
      const gcsFile = this.bucket.file(path);

      const [exists] = await gcsFile.exists();
      if (!exists) {
        throw new StorageFileNotFoundException(path);
      }

      return gcsFile.createReadStream();
    } catch (error: unknown) {
      if (error instanceof StorageFileNotFoundException) {
        throw error;
      }
      const e = error as Error;
      throw new StorageDownloadException(e.message || 'Unknown download error');
    }
  }
}
