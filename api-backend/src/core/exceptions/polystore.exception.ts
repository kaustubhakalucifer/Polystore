import { HttpException, HttpStatus, Logger } from '@nestjs/common';

/**
 * Base exception class for the Polystore platform.
 */
export class PolystoreException extends HttpException {
  constructor(
    message: string,
    status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
  ) {
    super(message, status);
  }
}

/**
 * Base exception class for storage-related operations.
 */
export class StorageException extends PolystoreException {
  constructor(
    message: string,
    status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
  ) {
    super(message, status);
  }
}

/**
 * Exception thrown when a file upload fails.
 */
export class StorageUploadException extends StorageException {
  constructor(message: string) {
    super(`Storage Upload Error: ${message}`, HttpStatus.BAD_REQUEST);
  }
}

/**
 * Exception thrown when a file download fails.
 */
export class StorageDownloadException extends StorageException {
  constructor(message: string) {
    super(
      `Storage Download Error: ${message}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

/**
 * Exception thrown when deleting a file fails.
 */
export class StorageDeleteException extends StorageException {
  constructor(message: string) {
    super(`Storage Delete Error: ${message}`, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Exception thrown when listing files fails.
 */
export class StorageListException extends StorageException {
  constructor(message: string) {
    super(`Storage List Error: ${message}`, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Exception thrown when a requested file is not found in storage.
 */
export class StorageFileNotFoundException extends StorageException {
  constructor(path: string) {
    super(`File not found at path: ${path}`, HttpStatus.NOT_FOUND);
  }
}
