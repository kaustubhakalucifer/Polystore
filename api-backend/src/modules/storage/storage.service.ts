import { Injectable } from '@nestjs/common';
import {
  StorageProviderFactory,
  StorageCredentials,
} from '../../core/storage/storage.factory';
import { IStorageProvider } from '../../core/interfaces/storage-provider.interface';

@Injectable()
export class StorageService {
  private getProvider(credentials: StorageCredentials): IStorageProvider {
    return StorageProviderFactory.create(credentials);
  }

  async uploadFile(
    credentials: StorageCredentials,
    path: string,
    file: Buffer | NodeJS.ReadableStream,
    mimetype?: string,
  ): Promise<string> {
    const provider = this.getProvider(credentials);
    return provider.upload(path, file, mimetype);
  }

  async deleteFile(
    credentials: StorageCredentials,
    path: string,
  ): Promise<void> {
    const provider = this.getProvider(credentials);
    return provider.delete(path);
  }

  async listFiles(
    credentials: StorageCredentials,
    prefix?: string,
    limit?: number,
    cursor?: string,
  ): Promise<{ keys: string[]; continuationToken?: string }> {
    const provider = this.getProvider(credentials);
    return provider.list(prefix, { limit, cursor });
  }

  async downloadFile(
    credentials: StorageCredentials,
    path: string,
  ): Promise<Buffer | NodeJS.ReadableStream> {
    const provider = this.getProvider(credentials);
    return provider.download(path);
  }
}
