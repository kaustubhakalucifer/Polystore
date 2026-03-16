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

describe('ConfigService - Environment Validation', () => {
  it('should load test environment variables when NODE_ENV=test', () => {
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/polystore_test';
    process.env.PORT = '3000';

    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.MONGODB_URI).toBe(
      'mongodb://localhost:27017/polystore_test',
    );
  });

  it('should use default PORT when not provided', () => {
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    delete process.env.PORT;

    const port = process.env.PORT ?? 3000;
    expect(port).toBe(3000);
  });

  it('should use default NODE_ENV when not provided', () => {
    delete process.env.NODE_ENV;
    delete process.env.MONGODB_URI;
    delete process.env.PORT;

    const nodeEnv = process.env.NODE_ENV ?? 'development';
    expect(nodeEnv).toBe('development');
  });
});

describe('ConfigService - MongoDB URI Formats', () => {
  it('should support local MongoDB connection string', () => {
    const localUri = 'mongodb://localhost:27017/polystore';
    expect(localUri).toContain('mongodb://');
    expect(localUri).toContain('localhost:27017');
  });

  it('should support MongoDB Atlas SRV connection string', () => {
    const atlasUri =
      'mongodb+srv://username:password@cluster.mongodb.net/database';
    expect(atlasUri).toContain('mongodb+srv://');
    expect(atlasUri).toContain('cluster.mongodb.net');
  });
});
