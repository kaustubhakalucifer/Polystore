import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { MongoDbModule } from './config/mongodb.module';
import { EncryptionModule } from './core/encryption/encryption.module';

@Module({
  imports: [
    // Load and validate environment variables
    ConfigModule,
    // Connect to MongoDB
    MongoDbModule,
    // AES-256-GCM encryption — globally available
    EncryptionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
