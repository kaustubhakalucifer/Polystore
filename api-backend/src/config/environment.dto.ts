import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsEnum,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Environment variables validation DTO
 * Validates all required environment variables for the application
 */
export class EnvironmentDto {
  @IsString()
  @IsNotEmpty({ message: 'MONGODB_URI is required' })
  @Transform(({ value }: { value: string }) => value?.trim())
  MONGODB_URI!: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(65535)
  @Transform(({ value }: { value?: string | number }) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'number') return value;
    const normalized = value.trim();
    return normalized === '' ? Number.NaN : Number(normalized);
  })
  PORT?: number;

  @IsEnum(['development', 'production', 'test'])
  @IsOptional()
  NODE_ENV?: 'development' | 'production' | 'test';
}

/**
 * Default values for environment variables
 */
export const DEFAULT_ENV_VALUES = {
  PORT: 3000,
  NODE_ENV: 'development',
};
