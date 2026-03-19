import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from './config.service';
import { ConfigModule } from './config.module';

describe('ConfigService', () => {
  let configService: ConfigService;

  beforeEach(async () => {
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/polystore_test';
    process.env.PORT = '3000';
    // 64-char hex test key (32 bytes) — safe to use in tests only
    process.env.ENCRYPTION_KEY = 'a'.repeat(64);
    process.env.JWT_SECRET = 'test-secret';
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'user';
    process.env.SMTP_PASS = 'pass';
    process.env.SMTP_FROM = 'noreply@example.com';

    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
    }).compile();

    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.NODE_ENV;
    delete process.env.MONGODB_URI;
    delete process.env.PORT;
    delete process.env.MONGODB_DB_NAME;
    delete process.env.ENCRYPTION_KEY;
    delete process.env.JWT_SECRET;
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.SMTP_FROM;
  });

  describe('Initialization', () => {
    it('should be defined', () => {
      expect(configService).toBeDefined();
    });
  });

  describe('get mongoUri', () => {
    it('should return the MongoDB URI from test environment', () => {
      expect(configService.mongoUri).toBe(
        'mongodb://localhost:27017/polystore_test',
      );
    });
  });

  describe('get port', () => {
    it('should return the configured port', () => {
      expect(configService.port).toBe(3000);
    });
  });

  describe('get nodeEnv', () => {
    it('should return the node environment', () => {
      expect(configService.nodeEnv).toBe('test');
    });
  });

  describe('get isDevelopment', () => {
    it('should return false when NODE_ENV is test', () => {
      expect(configService.isDevelopment).toBe(false);
    });
  });

  describe('get isProduction', () => {
    it('should return false when NODE_ENV is test', () => {
      expect(configService.isProduction).toBe(false);
    });
  });

  describe('get isTest', () => {
    it('should return true when NODE_ENV is test', () => {
      expect(configService.isTest).toBe(true);
    });
  });
});

describe('ConfigService - Default Values', () => {
  let configService: ConfigService;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'user';
    process.env.SMTP_PASS = 'pass';
    process.env.SMTP_FROM = 'noreply@example.com';
  });

  afterEach(() => {
    delete process.env.NODE_ENV;
    delete process.env.MONGODB_URI;
    delete process.env.PORT;
    delete process.env.MONGODB_DB_NAME;
    delete process.env.ENCRYPTION_KEY;
    delete process.env.JWT_SECRET;
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.SMTP_FROM;
  });

  it('should use default PORT when not provided', async () => {
    process.env.NODE_ENV = 'development';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    process.env.ENCRYPTION_KEY = 'b'.repeat(64);
    process.env.JWT_SECRET = 'test-secret';
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'user';
    process.env.SMTP_PASS = 'pass';
    process.env.SMTP_FROM = 'noreply@example.com';
    delete process.env.PORT;

    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
    }).compile();

    configService = module.get<ConfigService>(ConfigService);
    expect(configService.port).toBe(3000);
  });

  it('should use default NODE_ENV when not provided', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    process.env.ENCRYPTION_KEY = 'c'.repeat(64);
    process.env.JWT_SECRET = 'test-secret';
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'user';
    process.env.SMTP_PASS = 'pass';
    process.env.SMTP_FROM = 'noreply@example.com';
    delete process.env.NODE_ENV;
    delete process.env.PORT;

    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
    }).compile();

    configService = module.get<ConfigService>(ConfigService);
    expect(configService.nodeEnv).toBe('development');
  });
});
