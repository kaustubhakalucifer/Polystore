import {
  BlobServiceClient,
  ContainerClient,
  RestError,
} from '@azure/storage-blob';
import { IStorageProvider } from '../interfaces/storage-provider.interface';
import {
  StorageDeleteException,
  StorageDownloadException,
  StorageFileNotFoundException,
  StorageListException,
  StorageUploadException,
} from '../exceptions/polystore.exception';
import { PassThrough, Readable } from 'stream';

export interface AzureStorageProviderConfig {
  connectionString: string;
  containerName: string;
}

export class AzureStorageProvider implements IStorageProvider {
  private readonly blobServiceClient: BlobServiceClient;
  private readonly containerClient: ContainerClient;

  constructor(config: AzureStorageProviderConfig) {
    if (!config.containerName || config.containerName.trim() === '') {
      throw new Error('Azure storage container name must be provided');
    }
    if (!config.connectionString || config.connectionString.trim() === '') {
      throw new Error('Azure connection string must be provided');
    }

    this.blobServiceClient = BlobServiceClient.fromConnectionString(
      config.connectionString,
    );
    this.containerClient = this.blobServiceClient.getContainerClient(
      config.containerName,
    );
  }

  private ensureValidBlobPath(path: string): void {
    if (!path || path.trim() === '') {
      throw new TypeError('Blob path cannot be empty or whitespace');
    }
  }

  async upload(
    path: string,
    file: Buffer | NodeJS.ReadableStream,
    mimetype?: string,
  ): Promise<string> {
    this.ensureValidBlobPath(path);
    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(path);
      const options = mimetype
        ? { blobHTTPHeaders: { blobContentType: mimetype } }
        : undefined;

      if (Buffer.isBuffer(file)) {
        await blockBlobClient.uploadData(file, options);
      } else {
        // uploadStream handles stream backpressure efficiently
        await blockBlobClient.uploadStream(
          file as Readable,
          undefined,
          undefined,
          options,
        );
      }

      return path;
    } catch (error: unknown) {
      const e = error as Error;
      throw new StorageUploadException(e.message || 'Unknown upload error');
    }
  }

  async delete(path: string): Promise<void> {
    this.ensureValidBlobPath(path);
    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(path);
      // deleteIfExists skips errors if the blob is already missing
      await blockBlobClient.deleteIfExists();
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
      let maxPageSize: number | undefined;
      if (options?.limit !== undefined) {
        if (Number.isInteger(options.limit) && options.limit > 0) {
          maxPageSize = options.limit;
        }
      }

      const iterator = this.containerClient.listBlobsFlat({ prefix }).byPage({
        maxPageSize,
        continuationToken: options?.cursor,
      });

      const response = await iterator.next();

      if (response.done && !response.value) {
        return { keys: [] };
      }

      const page = response.value as {
        continuationToken?: string;
        segment: { blobItems: { name: string }[] };
      };
      const keys = page.segment.blobItems.map((blob) => blob.name);

      return {
        keys,
        continuationToken: page.continuationToken,
      };
    } catch (error: unknown) {
      const e = error as Error;
      throw new StorageListException(e.message || 'Unknown list error');
    }
  }

  async download(path: string): Promise<NodeJS.ReadableStream> {
    this.ensureValidBlobPath(path);
    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(path);

      // The download method will immediately throw if the blob does not exist
      const downloadResponse = await blockBlobClient.download(0);

      if (!downloadResponse.readableStreamBody) {
        throw new StorageDownloadException(
          'Readable stream body is not available',
        );
      }

      const readStream = downloadResponse.readableStreamBody;
      const passThrough = new PassThrough();

      readStream.on('error', (error: unknown) => {
        const err = error as RestError;
        if (err.statusCode === 404 || err.code === 'BlobNotFound') {
          passThrough.destroy(new StorageFileNotFoundException(path));
        } else {
          passThrough.destroy(
            new StorageDownloadException(
              err.message || 'Unknown download error',
            ),
          );
        }
      });

      return readStream.pipe(passThrough);
    } catch (error: unknown) {
      const err = error as RestError;
      if (err.statusCode === 404 || err.code === 'BlobNotFound') {
        throw new StorageFileNotFoundException(path);
      }
      throw new StorageDownloadException(
        err.message || 'Unknown download error',
      );
    }
  }
}
