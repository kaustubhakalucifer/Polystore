import { Module, Global } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ConfigService } from './config.service';

/**
 * Configuration module for the application
 * Provides validated environment variables throughout the app
 */
@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      envFilePath: ['.env.production', '.env.development', '.env'],
      ignoreEnvFile: false,
      isGlobal: true,
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
