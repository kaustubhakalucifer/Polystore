import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { MongoDbModule } from './config/mongodb.module';
import { EncryptionModule } from './core/encryption/encryption.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { StorageModule } from './modules/storage/storage.module';

@Module({
  imports: [
    ConfigModule,
    MongoDbModule,
    EncryptionModule,
    UsersModule,
    AuthModule,
    AdminModule,
    StorageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
