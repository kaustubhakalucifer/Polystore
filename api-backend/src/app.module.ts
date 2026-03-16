import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { MongoDbModule } from './config/mongodb.module';

@Module({
  imports: [
    // Load and validate environment variables
    ConfigModule,
    // Connect to MongoDB
    MongoDbModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
