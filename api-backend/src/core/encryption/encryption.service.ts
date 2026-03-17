import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { ConfigService } from 'src/config/config.service';

/**
 * AES-256-GCM Encryption Service
 *
 * Provides encrypt / decrypt helpers for storing cloud API keys securely.
 * All binary values are hex-encoded for safe storage in string fields (e.g. MongoDB).
 *
 * Stored payload format:  <iv_hex>:<authTag_hex>:<ciphertext_hex>
 *   - iv        : 12 random bytes (96-bit) — generated fresh per encryption
 *   - authTag   : 16 bytes (128-bit) — GCM authentication tag (integrity check)
 *   - ciphertext: variable length, same byte length as plaintext
 */
@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-gcm' as const;
  private readonly ivLength = 12; // bytes — 96-bit IV recommended for GCM
  private readonly authTagLength = 16; // bytes — 128-bit auth tag
  private readonly key: Buffer;

  constructor(private readonly configService: ConfigService) {
    const hexKey = this.configService.encryptionKey;
    this.key = Buffer.from(hexKey, 'hex');

    if (this.key.length !== 32) {
      throw new InternalServerErrorException(
        `ENCRYPTION_KEY must be a 64-character hex string (32 bytes). ` +
          `Got ${this.key.length} bytes.`,
      );
    }
  }

  /**
   * Encrypts a plaintext string using AES-256-GCM.
   *
   * @param plaintext - The value to encrypt (e.g. a raw cloud API key)
   * @returns  A composite hex string: `<iv>:<authTag>:<ciphertext>`
   */
  encrypt(plaintext: string): string {
    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv, {
        authTagLength: this.authTagLength,
      });

      const encrypted = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final(),
      ]);

      const authTag = cipher.getAuthTag();

      return [
        iv.toString('hex'),
        authTag.toString('hex'),
        encrypted.toString('hex'),
      ].join(':');
    } catch (error: unknown) {
      this.logger.error('Encryption failed', error);
      throw new InternalServerErrorException('Failed to encrypt value');
    }
  }

  /**
   * Decrypts a payload produced by {@link encrypt}.
   *
   * @param payload - Composite string in the format `<iv>:<authTag>:<ciphertext>`
   * @returns The original plaintext string
   * @throws BadRequestException if the payload is malformed or the auth tag is invalid
   */
  decrypt(payload: string): string {
    const parts = payload.split(':');

    if (parts.length !== 3) {
      throw new BadRequestException(
        `Invalid encrypted payload format. ` +
          `Expected "<iv>:<authTag>:<ciphertext>", got ${parts.length} segment(s).`,
      );
    }

    const [ivHex, authTagHex, ciphertextHex] = parts;

    try {
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const ciphertext = Buffer.from(ciphertextHex, 'hex');

      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv, {
        authTagLength: this.authTagLength,
      });
      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]);

      return decrypted.toString('utf8');
    } catch (error: unknown) {
      // GCM authentication failures surface as a generic Error from Node crypto
      if (
        error instanceof BadRequestException ||
        (error instanceof Error &&
          error.message.includes('Unsupported state or unable to authenticate'))
      ) {
        throw new BadRequestException(
          'Decryption failed: authentication tag mismatch. The data may be corrupted or tampered with.',
        );
      }

      this.logger.error('Decryption failed', error);
      throw new BadRequestException('Failed to decrypt value');
    }
  }
}
