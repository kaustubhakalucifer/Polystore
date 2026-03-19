import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from './config/config.service';
import { TransformInterceptor } from './core/interceptors/transform.interceptor';
const logger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get config service to trigger validation
  const configService = app.get(ConfigService);

  // Set global API prefix
  app.setGlobalPrefix('api');

  // Use validation pipe globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Apply the global response interceptor
  app.useGlobalInterceptors(new TransformInterceptor());

  const port = configService.port;
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Environment: ${configService.nodeEnv}`);
}

bootstrap().catch((err) => {
  logger.error('Application failed to start', err);
  process.exit(1);
});
