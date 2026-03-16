import { Module, Global } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ConfigService } from './config.service';

/**
 * Configuration module for the application
 * Provides validated environment variables throughout the app
 *
 * Environment file priority:
 * - .env.test (used when NODE_ENV=test)
 * - .env.production
 * - .env.development
 * - .env
 */
@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      envFilePath:
        process.env.NODE_ENV === 'test'
          ? ['.env.test', '.env.production', '.env.development', '.env']
          : ['.env.production', '.env.development', '.env'],
      ignoreEnvFile: false,
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
