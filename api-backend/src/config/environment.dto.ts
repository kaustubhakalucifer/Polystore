import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsEnum,
  IsOptional,
  IsHexadecimal,
  Length,
  Min,
  Max,
  IsEmail,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { type StringValue } from 'ms';

/**
 * Environment variables validation DTO
 * Validates all required environment variables for the application
 */
export class EnvironmentDto {
  @IsString()
  @IsNotEmpty({ message: 'MONGODB_URI is required' })
  @Transform(({ value }: { value: string }) => value?.trim())
  MONGODB_URI!: string;

  /**
   * 64-character hex string representing 32 raw bytes (256-bit key).
   * Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   */
  @IsString()
  @IsNotEmpty({ message: 'ENCRYPTION_KEY is required' })
  @IsHexadecimal({
    message: 'ENCRYPTION_KEY must be a valid hexadecimal string',
  })
  @Length(64, 64, {
    message: 'ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)',
  })
  @Transform(({ value }: { value: string }) => value?.trim())
  ENCRYPTION_KEY!: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }: { value?: string }) => value?.trim())
  MONGODB_DB_NAME?: string;

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

  /**
   * Super Admin email for initial database seeding
   */
  @IsString()
  @IsEmail()
  @IsOptional()
  @Transform(({ value }: { value?: string }) => value?.trim())
  SUPER_ADMIN_EMAIL?: string;

  /**
   * Super Admin password for initial database seeding
   */
  @IsString()
  @IsOptional()
  @Transform(({ value }: { value?: string }) => value?.trim())
  SUPER_ADMIN_PASSWORD?: string;

  @IsString()
  @IsNotEmpty({ message: 'JWT_SECRET is required' })
  @Transform(({ value }: { value?: string }) => value?.trim())
  JWT_SECRET!: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }: { value?: StringValue }) => value?.trim())
  JWT_EXPIRATION?: StringValue;

  @IsString()
  @IsNotEmpty()
  SMTP_HOST!: string;

  @IsInt()
  @IsNotEmpty()
  @Min(1)
  @Max(65535)
  @Transform(({ value }: { value?: string | number }) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'number') return value;
    const normalized = value.trim();
    return normalized === '' ? Number.NaN : Number(normalized);
  })
  SMTP_PORT!: number;

  @IsString()
  @IsNotEmpty()
  SMTP_USER!: string;

  @IsString()
  @IsNotEmpty()
  SMTP_PASS!: string;

  @IsString()
  @IsNotEmpty()
  SMTP_FROM!: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value?: string }) => value?.trim())
  ALLOWED_ORIGINS!: string;
}

/**
 * Default values for environment variables
 */
export const DEFAULT_ENV_VALUES = {
  JWT_EXPIRATION: '1d' as StringValue,
  PORT: 3000,
  NODE_ENV: 'development',
};
