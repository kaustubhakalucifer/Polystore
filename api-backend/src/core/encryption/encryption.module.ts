import { Global, Module } from '@nestjs/common';
import { EncryptionService } from './encryption.service';
import { ConfigModule } from 'src/config/config.module';

/**
 * Global encryption module.
 *
 * Marked @Global() so EncryptionService is available across all feature
 * modules without needing to re-import this module each time.
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [EncryptionService],
  exports: [EncryptionService],
})
export class EncryptionModule {}
