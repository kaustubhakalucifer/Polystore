import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
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

  @IsNumber()
  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
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
