export interface IStorageProvider {
  /**
   * Uploads a file to the storage provider.
   * @param path The destination path/key in the storage.
   * @param file The file content as a Buffer.
   * @param mimetype Optional MIME type of the file.
   * @returns A promise that resolves to the URL or identifier of the uploaded file.
   */
  upload(
    path: string,
    file: Buffer | NodeJS.ReadableStream,
    mimetype?: string,
  ): Promise<string>;

  /**
   * Deletes a file from the storage provider.
   * @param path The path/key of the file to delete.
   * @returns A promise that resolves when the deletion is complete.
   */
  delete(path: string): Promise<void>;

  /**
   * Lists files in a given directory path/prefix.
   * @param prefix Optional prefix to filter the files.
   * @param options Pagination options to limit results and resume with a cursor.
   * @returns A promise that resolves to an object containing keys and an optional continuationToken.
   */
  list(
    prefix?: string,
    options?: { limit?: number; cursor?: string },
  ): Promise<{ keys: string[]; continuationToken?: string }>;

  /**
   * Downloads a file from the storage provider.
   * @param path The path/key of the file to download.
   * @returns A promise that resolves to the file content as a Buffer or ReadableStream.
   */
  download(path: string): Promise<Buffer | NodeJS.ReadableStream>;
}
