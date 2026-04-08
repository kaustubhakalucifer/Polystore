import {
  IsString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsNumber,
} from 'class-validator';
import type { StorageCredentials } from '../../../core/storage/storage.factory';

export class DeleteFileDto {
  @IsString()
  @IsNotEmpty()
  path: string;

  @IsObject()
  @IsNotEmpty()
  credentials: StorageCredentials;
}

export class ListFilesDto {
  @IsObject()
  @IsNotEmpty()
  credentials: StorageCredentials;

  @IsString()
  @IsOptional()
  prefix?: string;

  @IsNumber()
  @IsOptional()
  limit?: number;

  @IsString()
  @IsOptional()
  cursor?: string;
}

export class DownloadFileDto {
  @IsString()
  @IsNotEmpty()
  path: string;

  @IsObject()
  @IsNotEmpty()
  credentials: StorageCredentials;
}
