import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { EnvironmentDto, DEFAULT_ENV_VALUES } from './environment.dto';

/**
 * Custom ConfigService that validates environment variables
 * on application startup
 */
@Injectable()
export class ConfigService implements OnModuleInit {
  private readonly logger = new Logger(ConfigService.name);
  private readonly validatedConfig: EnvironmentDto;

  constructor(private readonly nestConfigService: NestConfigService) {
    this.validatedConfig = this.validateAndTransform();
  }

  /**
   * Validate environment variables when module initializes
   */
  onModuleInit(): void {
    this.logger.log('Environment variables validated successfully');
    this.logger.debug(`Node environment: ${this.get('NODE_ENV')}`);
    this.logger.debug(`Port: ${this.get('PORT')}`);
  }

  /**
   * Validate and transform environment variables
   */
  private validateAndTransform(): EnvironmentDto {
    const envConfig = {
      MONGODB_URI: this.nestConfigService.get<string>('MONGODB_URI'),
      MONGODB_DB_NAME: this.nestConfigService.get<string>('MONGODB_DB_NAME'),
      PORT:
        this.nestConfigService.get<string | number>('PORT') ??
        DEFAULT_ENV_VALUES.PORT,
      NODE_ENV:
        this.nestConfigService.get<string>('NODE_ENV') ??
        DEFAULT_ENV_VALUES.NODE_ENV,
    };

    const instance = plainToInstance(EnvironmentDto, envConfig);
    const errors = validateSync(instance, {
      whitelist: true,
      forbidNonWhitelisted: true,
      skipMissingProperties: false,
    });

    if (errors.length > 0) {
      const errorMessages = errors
        .map((err) => Object.values(err.constraints || {}).join(', '))
        .join('; ');

      this.logger.error(`Environment validation failed: ${errorMessages}`);
      throw new Error(`Environment validation failed: ${errorMessages}`);
    }

    return instance;
  }

  /**
   * Get a validated environment variable
   */
  get<K extends keyof EnvironmentDto>(key: K): EnvironmentDto[K] {
    return this.validatedConfig[key];
  }

  /**
   * Get MongoDB URI
   */
  get mongoUri(): string {
    return this.validatedConfig.MONGODB_URI;
  }

  /**
   * Get MongoDB database name
   * If not provided, it will be extracted from the URI or use the default
   */
  get mongoDbName(): string | undefined {
    return this.validatedConfig.MONGODB_DB_NAME;
  }

  /**
   * Get application port
   */
  get port(): number {
    return this.validatedConfig.PORT ?? DEFAULT_ENV_VALUES.PORT;
  }

  /**
   * Get node environment
   */
  get nodeEnv(): string {
    return this.validatedConfig.NODE_ENV || DEFAULT_ENV_VALUES.NODE_ENV;
  }

  /**
   * Check if running in development mode
   */
  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  /**
   * Check if running in production mode
   */
  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  /**
   * Check if running in test mode
   */
  get isTest(): boolean {
    return this.nodeEnv === 'test';
  }
}
