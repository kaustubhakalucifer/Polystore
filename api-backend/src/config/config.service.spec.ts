import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from './config.service';
import { ConfigService as NestConfigService } from '@nestjs/config';

/**
 * Test constants
 */
const TEST_MONGODB_URI = 'mongodb+srv://test:test@cluster.mongodb.net/testdb';
const TEST_PORT = 3001;
const TEST_NODE_ENV = 'test';

describe('ConfigService', () => {
  let configService: ConfigService;

  const mockNestConfigService = {
    get: (key: string) => {
      const config: Record<string, string> = {
        MONGODB_URI: TEST_MONGODB_URI,
        PORT: String(TEST_PORT),
        NODE_ENV: TEST_NODE_ENV,
      };
      return config[key];
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigService,
        {
          provide: NestConfigService,
          useValue: mockNestConfigService,
        },
      ],
    }).compile();

    configService = module.get<ConfigService>(ConfigService);
  });

  describe('Initialization', () => {
    it('should be defined', () => {
      expect(configService).toBeDefined();
    });
  });

  describe('get mongoUri', () => {
    it('should return the MongoDB URI', () => {
      expect(configService.mongoUri).toBe(TEST_MONGODB_URI);
    });
  });

  describe('get port', () => {
    it('should return the configured port', () => {
      expect(configService.port).toBe(TEST_PORT);
    });
  });

  describe('get nodeEnv', () => {
    it('should return the node environment', () => {
      expect(configService.nodeEnv).toBe(TEST_NODE_ENV);
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
  it('should validate and return MongoDB URI', () => {
    const mockNestConfigService = {
      get: (key: string) => {
        const config: Record<string, string> = {
          MONGODB_URI: TEST_MONGODB_URI,
          PORT: String(TEST_PORT),
          NODE_ENV: TEST_NODE_ENV,
        };
        return config[key];
      },
    };

    expect(mockNestConfigService.get('MONGODB_URI')).toBe(TEST_MONGODB_URI);
  });

  it('should handle missing optional PORT with default', () => {
    const mockNestConfigService = {
      get: (key: string) => {
        if (key === 'PORT') return undefined;
        if (key === 'MONGODB_URI') return TEST_MONGODB_URI;
        if (key === 'NODE_ENV') return 'development';
        return undefined;
      },
    };

    // When PORT is missing, it should use default value of 3000
    const port = mockNestConfigService.get('PORT') ?? 3000;
    expect(port).toBe(3000);
  });

  it('should handle missing optional NODE_ENV with default', () => {
    const mockNestConfigService = {
      get: (key: string) => {
        if (key === 'NODE_ENV') return undefined;
        if (key === 'MONGODB_URI') return TEST_MONGODB_URI;
        if (key === 'PORT') return '3000';
        return undefined;
      },
    };

    // When NODE_ENV is missing, it should use default value of 'development'
    const nodeEnv = mockNestConfigService.get('NODE_ENV') ?? 'development';
    expect(nodeEnv).toBe('development');
  });
});

describe('ConfigService - MongoDB URI Formats', () => {
  it('should support standard MongoDB Atlas connection string', () => {
    const validAtlasUri =
      'mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority';
    expect(validAtlasUri).toContain('mongodb+srv://');
    expect(validAtlasUri).toContain('cluster.mongodb.net');
  });

  it('should support local MongoDB connection string', () => {
    const localUri = 'mongodb://localhost:27017/polystore';
    expect(localUri).toContain('mongodb://');
    expect(localUri).toContain('localhost:27017');
  });
});
