import { validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { EnvironmentDto } from './environment.dto';

// Valid 64-char hex key used across all "should pass" test fixtures
const VALID_KEY = 'a'.repeat(64);

describe('EnvironmentDto', () => {
  describe('Validation', () => {
    it('should pass validation with valid MongoDB URI', () => {
      const validConfig = {
        MONGODB_URI: 'mongodb+srv://user:pass@cluster.mongodb.net/testdb',
        ENCRYPTION_KEY: VALID_KEY,
        JWT_SECRET: 'test-secret',
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: '587',
        SMTP_USER: 'user',
        SMTP_PASS: 'pass',
        SMTP_FROM: 'noreply@example.com',
        PORT: '3000',
        NODE_ENV: 'development',
        ALLOWED_ORIGINS: 'http://localhost:3000',
      };

      const dto = plainToInstance(EnvironmentDto, validConfig);
      const errors = validateSync(dto);

      expect(errors.length).toBe(0);
    });

    it('should fail validation when MONGODB_URI is missing', () => {
      const invalidConfig = {
        MONGODB_URI: '',
        ENCRYPTION_KEY: VALID_KEY,
        JWT_SECRET: 'test-secret',
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: '587',
        SMTP_USER: 'user',
        SMTP_PASS: 'pass',
        SMTP_FROM: 'noreply@example.com',
        PORT: '3000',
        NODE_ENV: 'development',
        ALLOWED_ORIGINS: 'http://localhost:3000',
      };

      const dto = plainToInstance(EnvironmentDto, invalidConfig);
      const errors = validateSync(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toBeDefined();
      expect(errors[0].constraints?.isNotEmpty).toBeDefined();
    });

    it('should fail validation when MONGODB_URI is not provided', () => {
      const invalidConfig = {
        ENCRYPTION_KEY: VALID_KEY,
        JWT_SECRET: 'test-secret',
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: '587',
        SMTP_USER: 'user',
        SMTP_PASS: 'pass',
        SMTP_FROM: 'noreply@example.com',
        PORT: '3000',
        NODE_ENV: 'development',
        ALLOWED_ORIGINS: 'http://localhost:3000',
      };

      const dto = plainToInstance(EnvironmentDto, invalidConfig);
      const errors = validateSync(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should pass validation with optional PORT', () => {
      const configWithOptionalPort = {
        MONGODB_URI: 'mongodb+srv://user:pass@cluster.mongodb.net/testdb',
        ENCRYPTION_KEY: VALID_KEY,
        JWT_SECRET: 'test-secret',
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: '587',
        SMTP_USER: 'user',
        SMTP_PASS: 'pass',
        SMTP_FROM: 'noreply@example.com',
        NODE_ENV: 'development',
        ALLOWED_ORIGINS: 'http://localhost:3000',
      };

      const dto = plainToInstance(EnvironmentDto, configWithOptionalPort);
      const errors = validateSync(dto);

      expect(errors.length).toBe(0);
    });

    it('should pass validation with optional NODE_ENV', () => {
      const configWithOptionalEnv = {
        MONGODB_URI: 'mongodb+srv://user:pass@cluster.mongodb.net/testdb',
        ENCRYPTION_KEY: VALID_KEY,
        JWT_SECRET: 'test-secret',
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: '587',
        SMTP_USER: 'user',
        SMTP_PASS: 'pass',
        SMTP_FROM: 'noreply@example.com',
        PORT: '3000',
        ALLOWED_ORIGINS: 'http://localhost:3000',
      };

      const dto = plainToInstance(EnvironmentDto, configWithOptionalEnv);
      const errors = validateSync(dto);

      expect(errors.length).toBe(0);
    });

    it('should fail validation when NODE_ENV is invalid', () => {
      const invalidConfig = {
        MONGODB_URI: 'mongodb+srv://user:pass@cluster.mongodb.net/testdb',
        ENCRYPTION_KEY: VALID_KEY,
        JWT_SECRET: 'test-secret',
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: '587',
        SMTP_USER: 'user',
        SMTP_PASS: 'pass',
        SMTP_FROM: 'noreply@example.com',
        PORT: '3000',
        NODE_ENV: 'invalid',
        ALLOWED_ORIGINS: 'http://localhost:3000',
      };

      const dto = plainToInstance(EnvironmentDto, invalidConfig);
      const errors = validateSync(dto);

      expect(errors.length).toBeGreaterThan(0);
      const nodeEnvError = errors.find((e) => e.property === 'NODE_ENV');
      expect(nodeEnvError).toBeDefined();
    });

    it('should accept all valid NODE_ENV values', () => {
      const envValues = ['development', 'production', 'test'];

      envValues.forEach((envValue) => {
        const config = {
          MONGODB_URI: 'mongodb+srv://user:pass@cluster.mongodb.net/testdb',
          ENCRYPTION_KEY: VALID_KEY,
          JWT_SECRET: 'test-secret',
          SMTP_HOST: 'smtp.example.com',
          SMTP_PORT: '587',
          SMTP_USER: 'user',
          SMTP_PASS: 'pass',
          SMTP_FROM: 'noreply@example.com',
          PORT: '3000',
          NODE_ENV: envValue,
          ALLOWED_ORIGINS: 'http://localhost:3000',
        };

        const dto = plainToInstance(EnvironmentDto, config);
        const errors = validateSync(dto);

        expect(errors.length).toBe(0);
      });
    });

    it('should handle numeric PORT', () => {
      const configWithNumericPort = {
        MONGODB_URI: 'mongodb+srv://user:pass@cluster.mongodb.net/testdb',
        ENCRYPTION_KEY: VALID_KEY,
        JWT_SECRET: 'test-secret',
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: '587',
        SMTP_USER: 'user',
        SMTP_PASS: 'pass',
        SMTP_FROM: 'noreply@example.com',
        PORT: 3000,
        NODE_ENV: 'development',
        ALLOWED_ORIGINS: 'http://localhost:3000',
      };

      const dto = plainToInstance(EnvironmentDto, configWithNumericPort);
      const errors = validateSync(dto);

      expect(errors.length).toBe(0);
    });
  });

  describe('MongoDB URI Formats', () => {
    it('should validate MongoDB Atlas SRV connection string', () => {
      const atlasConfig = {
        MONGODB_URI:
          'mongodb+srv://username:password@cluster-name.mongodb.net/database?retryWrites=true&w=majority',
        ENCRYPTION_KEY: VALID_KEY,
        JWT_SECRET: 'test-secret',
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: '587',
        SMTP_USER: 'user',
        SMTP_PASS: 'pass',
        SMTP_FROM: 'noreply@example.com',
        ALLOWED_ORIGINS: 'http://localhost:3000',
      };

      const dto = plainToInstance(EnvironmentDto, atlasConfig);
      const errors = validateSync(dto);

      expect(errors.length).toBe(0);
    });

    it('should validate standard MongoDB connection string', () => {
      const standardConfig = {
        MONGODB_URI: 'mongodb://localhost:27017/polystore',
        ENCRYPTION_KEY: VALID_KEY,
        JWT_SECRET: 'test-secret',
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: '587',
        SMTP_USER: 'user',
        SMTP_PASS: 'pass',
        SMTP_FROM: 'noreply@example.com',
        ALLOWED_ORIGINS: 'http://localhost:3000',
      };

      const dto = plainToInstance(EnvironmentDto, standardConfig);
      const errors = validateSync(dto);

      expect(errors.length).toBe(0);
    });

    it('should validate MongoDB with authentication database', () => {
      const authConfig = {
        MONGODB_URI:
          'mongodb://user:password@localhost:27017/admin?authSource=admin',
        ENCRYPTION_KEY: VALID_KEY,
        JWT_SECRET: 'test-secret',
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: '587',
        SMTP_USER: 'user',
        SMTP_PASS: 'pass',
        SMTP_FROM: 'noreply@example.com',
        ALLOWED_ORIGINS: 'http://localhost:3000',
      };

      const dto = plainToInstance(EnvironmentDto, authConfig);
      const errors = validateSync(dto);

      expect(errors.length).toBe(0);
    });
  });

  describe('ENCRYPTION_KEY validation', () => {
    it('should pass with a valid 64-char hex key', () => {
      const dto = plainToInstance(EnvironmentDto, {
        MONGODB_URI: 'mongodb://localhost:27017/test',
        ENCRYPTION_KEY: VALID_KEY,
        JWT_SECRET: 'test-secret',
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: '587',
        SMTP_USER: 'user',
        SMTP_PASS: 'pass',
        SMTP_FROM: 'noreply@example.com',
        ALLOWED_ORIGINS: 'http://localhost:3000',
      });
      expect(validateSync(dto).length).toBe(0);
    });

    it('should fail when ENCRYPTION_KEY is missing', () => {
      const dto = plainToInstance(EnvironmentDto, {
        MONGODB_URI: 'mongodb://localhost:27017/test',
      });
      const errors = validateSync(dto);
      expect(errors.some((e) => e.property === 'ENCRYPTION_KEY')).toBe(true);
    });

    it('should fail when ENCRYPTION_KEY is too short (< 64 chars)', () => {
      const dto = plainToInstance(EnvironmentDto, {
        MONGODB_URI: 'mongodb://localhost:27017/test',
        ENCRYPTION_KEY: 'a'.repeat(62),
      });
      const errors = validateSync(dto);
      expect(errors.some((e) => e.property === 'ENCRYPTION_KEY')).toBe(true);
    });

    it('should fail when ENCRYPTION_KEY is too long (> 64 chars)', () => {
      const dto = plainToInstance(EnvironmentDto, {
        MONGODB_URI: 'mongodb://localhost:27017/test',
        ENCRYPTION_KEY: 'a'.repeat(66),
      });
      const errors = validateSync(dto);
      expect(errors.some((e) => e.property === 'ENCRYPTION_KEY')).toBe(true);
    });

    it('should fail when ENCRYPTION_KEY contains non-hex characters', () => {
      const dto = plainToInstance(EnvironmentDto, {
        MONGODB_URI: 'mongodb://localhost:27017/test',
        // 64 chars but includes 'z' which is not hex
        ENCRYPTION_KEY: 'z'.repeat(64),
      });
      const errors = validateSync(dto);
      expect(errors.some((e) => e.property === 'ENCRYPTION_KEY')).toBe(true);
    });
  });
});
