import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from './config.service';

/**
 * MongoDB module configuration
 * Uses the validated ConfigService to get the MongoDB URI
 *
 * Note: If MONGODB_DB_NAME is not set, the database name will be extracted
 * from the connection string URI. The dbName option will only override it
 * if explicitly configured.
 */
@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const options: {
          uri: string;
          dbName?: string;
          serverSelectionTimeoutMS: number;
          socketTimeoutMS: number;
        } = {
          uri: configService.mongoUri,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        };

        // Only set dbName if explicitly configured
        if (configService.mongoDbName) {
          options.dbName = configService.mongoDbName;
        }

        return options;
      },
    }),
  ],
  exports: [MongooseModule],
})
export class MongoDbModule {}
