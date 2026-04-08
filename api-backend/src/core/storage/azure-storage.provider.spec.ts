/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { AzureStorageProvider } from './azure-storage.provider';
import { BlobServiceClient } from '@azure/storage-blob';
import {
  StorageDeleteException,
  StorageDownloadException,
  StorageFileNotFoundException,
  StorageListException,
  StorageUploadException,
} from '../exceptions/polystore.exception';
import { PassThrough } from 'stream';

jest.mock('@azure/storage-blob');

describe('AzureStorageProvider', () => {
  let provider: AzureStorageProvider;
  let mockBlobServiceClient: jest.Mocked<any>;
  let mockContainerClient: jest.Mocked<any>;
  let mockBlockBlobClient: jest.Mocked<any>;

  beforeEach(() => {
    mockBlockBlobClient = {
      uploadData: jest.fn(),
      uploadStream: jest.fn(),
      deleteIfExists: jest.fn(),
      download: jest.fn(),
    };

    mockContainerClient = {
      getBlockBlobClient: jest.fn().mockReturnValue(mockBlockBlobClient),
      listBlobsFlat: jest.fn(),
    };

    mockBlobServiceClient = {
      getContainerClient: jest.fn().mockReturnValue(mockContainerClient),
    };

    (BlobServiceClient.fromConnectionString as jest.Mock).mockReturnValue(
      mockBlobServiceClient,
    );

    provider = new AzureStorageProvider({
      connectionString: 'UseDevelopmentStorage=true',
      containerName: 'test-container',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should throw an error if containerName is not provided', () => {
      expect(
        () =>
          new AzureStorageProvider({
            connectionString: 'cs',
            containerName: '',
          }),
      ).toThrow('Azure storage container name must be provided');
    });

    it('should throw an error if connectionString is not provided', () => {
      expect(
        () =>
          new AzureStorageProvider({
            connectionString: '',
            containerName: 'cn',
          }),
      ).toThrow('Azure connection string must be provided');
    });
  });

  describe('path validation', () => {
    it('should throw TypeError for empty or whitespace paths in upload', async () => {
      await expect(provider.upload('   ', Buffer.from('data'))).rejects.toThrow(
        TypeError,
      );
    });

    it('should throw TypeError for empty or whitespace paths in delete', async () => {
      await expect(provider.delete('')).rejects.toThrow(TypeError);
    });

    it('should throw TypeError for empty or whitespace paths in download', async () => {
      await expect(provider.download(' \n ')).rejects.toThrow(TypeError);
    });
  });

  describe('upload', () => {
    it('should successfully upload a Buffer', async () => {
      const buffer = Buffer.from('test');
      mockBlockBlobClient.uploadData.mockResolvedValueOnce({});

      const result = await provider.upload('path/to/file.txt', buffer);

      expect(result).toBe('path/to/file.txt');
      expect(mockContainerClient.getBlockBlobClient).toHaveBeenCalledWith(
        'path/to/file.txt',
      );
      expect(mockBlockBlobClient.uploadData).toHaveBeenCalledWith(
        buffer,
        undefined,
      );
    });

    it('should successfully upload a stream', async () => {
      const stream = new PassThrough();
      mockBlockBlobClient.uploadStream.mockResolvedValueOnce({});

      const result = await provider.upload(
        'path/to/file.txt',
        stream,
        'text/plain',
      );

      expect(result).toBe('path/to/file.txt');
      expect(mockContainerClient.getBlockBlobClient).toHaveBeenCalledWith(
        'path/to/file.txt',
      );
      expect(mockBlockBlobClient.uploadStream).toHaveBeenCalledWith(
        stream,
        undefined,
        undefined,
        { blobHTTPHeaders: { blobContentType: 'text/plain' } },
      );
    });

    it('should map errors to StorageUploadException', async () => {
      const buffer = Buffer.from('test');
      mockBlockBlobClient.uploadData.mockRejectedValueOnce(
        new Error('Upload failed'),
      );

      await expect(provider.upload('path/to/file.txt', buffer)).rejects.toThrow(
        StorageUploadException,
      );
    });
  });

  describe('delete', () => {
    it('should successfully delete a file', async () => {
      mockBlockBlobClient.deleteIfExists.mockResolvedValueOnce({});

      await provider.delete('path/to/file.txt');

      expect(mockContainerClient.getBlockBlobClient).toHaveBeenCalledWith(
        'path/to/file.txt',
      );
      expect(mockBlockBlobClient.deleteIfExists).toHaveBeenCalled();
    });

    it('should map errors to StorageDeleteException', async () => {
      mockBlockBlobClient.deleteIfExists.mockRejectedValueOnce(
        new Error('Delete failed'),
      );

      await expect(provider.delete('path/to/file.txt')).rejects.toThrow(
        StorageDeleteException,
      );
    });
  });

  describe('list', () => {
    it('should return empty keys when no blobs found', async () => {
      const mockIterator = {
        next: jest.fn().mockResolvedValueOnce({ done: true, value: null }),
      };
      mockContainerClient.listBlobsFlat.mockReturnValue({
        byPage: jest.fn().mockReturnValue(mockIterator),
      });

      const result = await provider.list();

      expect(result).toEqual({ keys: [] });
    });

    it('should return keys and continuationToken for valid page', async () => {
      const mockPage = {
        continuationToken: 'next-token',
        segment: {
          blobItems: [{ name: 'file1.txt' }, { name: 'file2.txt' }],
        },
      };
      const mockIterator = {
        next: jest.fn().mockResolvedValueOnce({ done: false, value: mockPage }),
      };
      mockContainerClient.listBlobsFlat.mockReturnValue({
        byPage: jest.fn().mockReturnValue(mockIterator),
      });

      const result = await provider.list('prefix', { limit: 10 });

      expect(result).toEqual({
        keys: ['file1.txt', 'file2.txt'],
        continuationToken: 'next-token',
      });
      expect(mockContainerClient.listBlobsFlat).toHaveBeenCalledWith({
        prefix: 'prefix',
      });
    });

    it('should handle limit option validation correctly', async () => {
      const mockByPage = jest.fn().mockReturnValue({
        next: jest.fn().mockResolvedValueOnce({ done: true, value: null }),
      });
      mockContainerClient.listBlobsFlat.mockReturnValue({ byPage: mockByPage });

      await provider.list('prefix', { limit: -5 }); // Invalid limit

      expect(mockByPage).toHaveBeenCalledWith({
        maxPageSize: undefined, // Should be omitted/undefined since it's invalid
        continuationToken: undefined,
      });
    });

    it('should map errors to StorageListException', async () => {
      mockContainerClient.listBlobsFlat.mockImplementationOnce(() => {
        throw new Error('List failed');
      });

      await expect(provider.list()).rejects.toThrow(StorageListException);
    });
  });

  describe('download', () => {
    it('should successfully download a file', async () => {
      const mockReadableStream = new PassThrough();
      mockReadableStream.end('test content');

      mockBlockBlobClient.download.mockResolvedValueOnce({
        readableStreamBody: mockReadableStream,
      });

      const stream = await provider.download('path/to/file.txt');
      expect(stream).toBeInstanceOf(PassThrough);
    });

    it('should throw StorageDownloadException if readableStreamBody is not available', async () => {
      mockBlockBlobClient.download.mockResolvedValueOnce({});

      await expect(provider.download('path/to/file.txt')).rejects.toThrow(
        StorageDownloadException,
      );
    });

    it('should throw StorageFileNotFoundException when download returns 404', async () => {
      const error = Object.assign(new Error('Not Found'), { statusCode: 404 });
      mockBlockBlobClient.download.mockRejectedValueOnce(error);

      await expect(provider.download('path/to/file.txt')).rejects.toThrow(
        StorageFileNotFoundException,
      );
    });

    it('should throw StorageFileNotFoundException when download returns BlobNotFound code', async () => {
      const error = Object.assign(new Error('Not Found'), {
        code: 'BlobNotFound',
      });
      mockBlockBlobClient.download.mockRejectedValueOnce(error);

      await expect(provider.download('path/to/file.txt')).rejects.toThrow(
        StorageFileNotFoundException,
      );
    });

    it('should pass through destroy with StorageFileNotFoundException for 404 from stream error', async () => {
      const mockReadableStream = new PassThrough();
      mockBlockBlobClient.download.mockResolvedValueOnce({
        readableStreamBody: mockReadableStream,
      });

      const stream = await provider.download('path/to/file.txt');

      const errorPromise = new Promise((resolve) => {
        stream.on('error', (err) => resolve(err));
      });

      const restError = Object.assign(new Error('Not Found'), {
        statusCode: 404,
      });
      mockReadableStream.emit('error', restError);

      const err = await errorPromise;
      expect(err).toBeInstanceOf(StorageFileNotFoundException);
    });

    it('should pass through destroy with StorageDownloadException for other stream errors', async () => {
      const mockReadableStream = new PassThrough();
      mockBlockBlobClient.download.mockResolvedValueOnce({
        readableStreamBody: mockReadableStream,
      });

      const stream = await provider.download('path/to/file.txt');

      const errorPromise = new Promise((resolve) => {
        stream.on('error', (err) => resolve(err));
      });

      const restError = Object.assign(new Error('Other Error'), {
        statusCode: 500,
      });
      mockReadableStream.emit('error', restError);

      const err = await errorPromise;
      expect(err).toBeInstanceOf(StorageDownloadException);
    });
  });
});
