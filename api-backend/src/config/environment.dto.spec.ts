import { validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { EnvironmentDto } from './environment.dto';

describe('EnvironmentDto', () => {
  describe('Validation', () => {
    it('should pass validation with valid MongoDB URI', () => {
      const validConfig = {
        MONGODB_URI: 'mongodb+srv://user:pass@cluster.mongodb.net/testdb',
        PORT: '3000',
        NODE_ENV: 'development',
      };

      const dto = plainToInstance(EnvironmentDto, validConfig);
      const errors = validateSync(dto);

      expect(errors.length).toBe(0);
    });

    it('should fail validation when MONGODB_URI is missing', () => {
      const invalidConfig = {
        MONGODB_URI: '',
        PORT: '3000',
        NODE_ENV: 'development',
      };

      const dto = plainToInstance(EnvironmentDto, invalidConfig);
      const errors = validateSync(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toBeDefined();
      expect(errors[0].constraints?.isNotEmpty).toBeDefined();
    });

    it('should fail validation when MONGODB_URI is not provided', () => {
      const invalidConfig = {
        PORT: '3000',
        NODE_ENV: 'development',
      };

      const dto = plainToInstance(EnvironmentDto, invalidConfig);
      const errors = validateSync(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should pass validation with optional PORT', () => {
      const configWithOptionalPort = {
        MONGODB_URI: 'mongodb+srv://user:pass@cluster.mongodb.net/testdb',
        NODE_ENV: 'development',
      };

      const dto = plainToInstance(EnvironmentDto, configWithOptionalPort);
      const errors = validateSync(dto);

      expect(errors.length).toBe(0);
    });

    it('should pass validation with optional NODE_ENV', () => {
      const configWithOptionalEnv = {
        MONGODB_URI: 'mongodb+srv://user:pass@cluster.mongodb.net/testdb',
        PORT: '3000',
      };

      const dto = plainToInstance(EnvironmentDto, configWithOptionalEnv);
      const errors = validateSync(dto);

      expect(errors.length).toBe(0);
    });

    it('should fail validation when NODE_ENV is invalid', () => {
      const invalidConfig = {
        MONGODB_URI: 'mongodb+srv://user:pass@cluster.mongodb.net/testdb',
        PORT: '3000',
        NODE_ENV: 'invalid',
      };

      const dto = plainToInstance(EnvironmentDto, invalidConfig);
      const errors = validateSync(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should accept all valid NODE_ENV values', () => {
      const envValues = ['development', 'production', 'test'];

      envValues.forEach((envValue) => {
        const config = {
          MONGODB_URI: 'mongodb+srv://user:pass@cluster.mongodb.net/testdb',
          PORT: '3000',
          NODE_ENV: envValue,
        };

        const dto = plainToInstance(EnvironmentDto, config);
        const errors = validateSync(dto);

        expect(errors.length).toBe(0);
      });
    });

    it('should handle numeric PORT', () => {
      const configWithNumericPort = {
        MONGODB_URI: 'mongodb+srv://user:pass@cluster.mongodb.net/testdb',
        PORT: 3000,
        NODE_ENV: 'development',
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
      };

      const dto = plainToInstance(EnvironmentDto, atlasConfig);
      const errors = validateSync(dto);

      expect(errors.length).toBe(0);
    });

    it('should validate standard MongoDB connection string', () => {
      const standardConfig = {
        MONGODB_URI: 'mongodb://localhost:27017/polystore',
      };

      const dto = plainToInstance(EnvironmentDto, standardConfig);
      const errors = validateSync(dto);

      expect(errors.length).toBe(0);
    });

    it('should validate MongoDB with authentication database', () => {
      const authConfig = {
        MONGODB_URI:
          'mongodb://user:password@localhost:27017/admin?authSource=admin',
      };

      const dto = plainToInstance(EnvironmentDto, authConfig);
      const errors = validateSync(dto);

      expect(errors.length).toBe(0);
    });
  });
});
