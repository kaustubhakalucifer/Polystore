import { BadRequestException } from '@nestjs/common';
import { EncryptionService } from './encryption.service';
import { ConfigService } from '../../config/config.service';
import * as crypto from 'crypto';

// A valid 32-byte (64-char hex) test key — never use in production!
const TEST_KEY = crypto.randomBytes(32).toString('hex');

/**
 * Build a lightweight ConfigService stub that returns only what
 * EncryptionService needs, without spinning up the full NestJS DI container.
 */
function buildService(hexKey: string = TEST_KEY): EncryptionService {
  const configStub = {
    encryptionKey: hexKey,
  } as unknown as ConfigService;

  return new EncryptionService(configStub);
}

describe('EncryptionService', () => {
  let service: EncryptionService;

  beforeEach(() => {
    service = buildService();
  });

  // ─── Round-trip ───────────────────────────────────────────────────────────

  describe('encrypt / decrypt (round-trip)', () => {
    it('should decrypt back to the original plaintext for a typical API key', () => {
      const apiKey =
        'AKIAIOSFODNN7EXAMPLE:wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';
      expect(service.decrypt(service.encrypt(apiKey))).toBe(apiKey);
    });

    it('should round-trip an empty string', () => {
      expect(service.decrypt(service.encrypt(''))).toBe('');
    });

    it('should round-trip a 512-char random string (large API credential)', () => {
      const long = crypto.randomBytes(256).toString('hex'); // 512 hex chars
      expect(service.decrypt(service.encrypt(long))).toBe(long);
    });

    it('should round-trip a string with special / Unicode characters', () => {
      const special = '🔑 key=val&foo=bär/baz?x=1+2';
      expect(service.decrypt(service.encrypt(special))).toBe(special);
    });
  });

  // ─── Ciphertext uniqueness ────────────────────────────────────────────────

  describe('encrypt — uniqueness', () => {
    it('should produce a different ciphertext on each call (random IV)', () => {
      const plaintext = 'my-secret-api-key';
      const first = service.encrypt(plaintext);
      const second = service.encrypt(plaintext);
      expect(first).not.toBe(second);
    });
  });

  // ─── Payload format ───────────────────────────────────────────────────────

  describe('encrypt — payload format', () => {
    it('should return a string with exactly two colons (iv:authTag:ciphertext)', () => {
      const payload = service.encrypt('test');
      const parts = payload.split(':');
      expect(parts).toHaveLength(3);
    });

    it('should produce hex-only segments (no non-hex characters)', () => {
      const payload = service.encrypt('test');
      for (const part of payload.split(':')) {
        expect(part).toMatch(/^[0-9a-f]+$/);
      }
    });

    it('should produce a 24-char IV segment (12 bytes × 2 hex chars)', () => {
      const [ivHex] = service.encrypt('test').split(':');
      expect(ivHex).toHaveLength(24);
    });

    it('should produce a 32-char auth tag segment (16 bytes × 2 hex chars)', () => {
      const [, authTagHex] = service.encrypt('test').split(':');
      expect(authTagHex).toHaveLength(32);
    });
  });

  // ─── Tamper detection ─────────────────────────────────────────────────────

  describe('decrypt — tamper detection', () => {
    it('should throw BadRequestException when the auth tag is mutated', () => {
      const payload = service.encrypt('sensitive-value');
      const [iv, authTag, ciphertext] = payload.split(':');

      // Flip the last hex byte of the auth tag
      const tamperedAuthTag =
        authTag.slice(0, -2) +
        (parseInt(authTag.slice(-2), 16) ^ 0xff).toString(16).padStart(2, '0');

      const tampered = `${iv}:${tamperedAuthTag}:${ciphertext}`;
      expect(() => service.decrypt(tampered)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException when the ciphertext is mutated', () => {
      const payload = service.encrypt('sensitive-value');
      const [iv, authTag, ciphertext] = payload.split(':');

      const tamperedCiphertext =
        ciphertext.slice(0, -2) +
        (parseInt(ciphertext.slice(-2), 16) ^ 0x01)
          .toString(16)
          .padStart(2, '0');

      const tampered = `${iv}:${authTag}:${tamperedCiphertext}`;
      expect(() => service.decrypt(tampered)).toThrow(BadRequestException);
    });
  });

  // ─── Malformed payload ────────────────────────────────────────────────────

  describe('decrypt — malformed payload', () => {
    it('should throw BadRequestException for a plain string (no colons)', () => {
      expect(() => service.decrypt('notavalidpayload')).toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if only one colon is present', () => {
      expect(() => service.decrypt('iv:ciphertext')).toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if more than two colons are present', () => {
      // Our decrypt currently splits on ALL colons; a payload with 4 segments is invalid
      expect(() => service.decrypt('a:b:c:d')).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for an empty string', () => {
      expect(() => service.decrypt('')).toThrow(BadRequestException);
    });
  });

  // ─── Bad key length ───────────────────────────────────────────────────────

  describe('constructor — key validation', () => {
    it('should throw InternalServerErrorException when key is too short', () => {
      // 30 bytes → 60 hex chars, not 64
      const shortKey = crypto.randomBytes(30).toString('hex');
      expect(() => buildService(shortKey)).toThrow();
    });

    it('should throw InternalServerErrorException when key is too long', () => {
      // 33 bytes → 66 hex chars
      const longKey = crypto.randomBytes(33).toString('hex');
      expect(() => buildService(longKey)).toThrow();
    });
  });
});
