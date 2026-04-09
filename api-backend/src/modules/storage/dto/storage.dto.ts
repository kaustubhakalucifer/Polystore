import {
  IsString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsInt,
  Min,
  ValidateNested,
  IsEnum,
  IsNotEmptyObject,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { StorageProviderType } from '../../../core/storage/storage.factory';

export class StorageCredentialsDto {
  @IsEnum(StorageProviderType)
  @IsNotEmpty()
  type: StorageProviderType;

  @IsObject()
  @IsNotEmptyObject()
  config: Record<string, any>;
}

export class UploadFileDto {
  @IsString()
  @IsNotEmpty()
  path: string;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as unknown;
      } catch {
        return value;
      }
    }
    return value as unknown;
  })
  @ValidateNested()
  @Type(() => StorageCredentialsDto)
  @IsNotEmpty()
  credentials: StorageCredentialsDto;
}

export class DeleteFileDto {
  @IsString()
  @IsNotEmpty()
  path: string;

  @ValidateNested()
  @Type(() => StorageCredentialsDto)
  @IsNotEmpty()
  credentials: StorageCredentialsDto;
}

export class ListFilesDto {
  @ValidateNested()
  @Type(() => StorageCredentialsDto)
  @IsNotEmpty()
  credentials: StorageCredentialsDto;

  @IsString()
  @IsOptional()
  prefix?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsString()
  @IsOptional()
  cursor?: string;
}

export class DownloadFileDto {
  @IsString()
  @IsNotEmpty()
  path: string;

  @ValidateNested()
  @Type(() => StorageCredentialsDto)
  @IsNotEmpty()
  credentials: StorageCredentialsDto;
}
