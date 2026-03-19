import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { User } from '../src/modules/users/schemas/user.schema';
import { PlatformRole, UserStatus } from '../src/core/enums';
import { EncryptionService } from '../src/core/encryption/encryption.service';

type MockUser = Partial<User> & {
  email: string;
  passwordHash?: string;
  otpCode?: string;
  save: jest.Mock<Promise<MockUser>, []>;
};

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  let userModel: Model<User>;
  const userEmail = 'test@example.com';
  const userPassword = 'password123';

  const mockUserStore = new Map<string, MockUser>();

  beforeAll(async () => {
    const mockUserModel = {
      findOne: jest.fn(
        (query: {
          email: string;
        }): {
          select: jest.Mock<Promise<MockUser | null>, []>;
          exec: jest.Mock<Promise<MockUser | null>, []>;
        } => {
          const user = mockUserStore.get(query.email) ?? null;

          const mockSelect = jest.fn().mockReturnThis();
          const mockExec = jest.fn().mockResolvedValue(user);

          // Provide thenable support for direct await
          const queryObj = {
            select: mockSelect,
            exec: mockExec,
            then: (resolve: (val: MockUser | null) => void) => resolve(user),
          } as unknown as {
            select: jest.Mock<Promise<MockUser | null>, []>;
            exec: jest.Mock<Promise<MockUser | null>, []>;
          };

          return queryObj;
        },
      ) as unknown as typeof userModel.findOne,

      create: jest.fn((data: Partial<MockUser>): MockUser => {
        const user: MockUser = {
          ...data,
          email: data.email!,
          save: jest.fn().mockImplementation(function (this: MockUser) {
            mockUserStore.set(this.email, this);
            return Promise.resolve(this);
          }) as jest.Mock<Promise<MockUser>, []>,
        };

        mockUserStore.set(user.email, user);
        return user;
      }) as unknown as typeof userModel.create,

      deleteMany: jest.fn((): void => {
        mockUserStore.clear();
      }) as unknown as typeof userModel.deleteMany,
    };

    const MockUserModelConstructor = function (
      this: MockUser,
      data: Partial<MockUser>,
    ) {
      Object.assign(this, data);

      this.save = jest.fn().mockImplementation(() => {
        mockUserStore.set(this.email, this);
        return Promise.resolve(this);
      }) as jest.Mock<Promise<MockUser>, []>;
    } as unknown as typeof userModel;

    MockUserModelConstructor.findOne = mockUserModel.findOne;
    MockUserModelConstructor.create = mockUserModel.create;
    MockUserModelConstructor.deleteMany = mockUserModel.deleteMany;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getModelToken(User.name))
      .useValue(MockUserModelConstructor)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    userModel = moduleFixture.get<Model<User>>(getModelToken(User.name));

    const passwordHash = await bcrypt.hash(userPassword, 10);
    mockUserStore.set(userEmail, {
      email: userEmail,
      passwordHash,
      platformRole: PlatformRole.USER,
      status: UserStatus.ACTIVE,
      firstName: 'Test',
      lastName: 'User',
      save: jest.fn().mockResolvedValue({}),
    } as unknown as MockUser);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Registration Flow', () => {
    const newEmail = 'newuser@example.com';
    const password = 'password123';
    let otpCode: string;

    it('/auth/register (POST) - should return 201 and send OTP', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: newEmail,
          password,
          firstName: 'New',
          lastName: 'User',
        })
        .expect(201);

      expect(response.body).toHaveProperty('message', 'OTP sent to email');

      // Verify user was created in DB
      const user = await userModel
        .findOne({ email: newEmail })
        .select('+otpCode');
      expect(user).toBeDefined();
      expect(user?.status).toBe(UserStatus.UNVERIFIED);
      expect(user?.otpCode).toBeDefined();

      // We need to capture the unencrypted OTP from EmailService.
      // Since it's an e2e test, we would normally get it from the mock email service.
      // For this test without modifying EmailService mock, we decrypt the DB value.
      const encryptionService = app.get(EncryptionService);
      if (!user?.otpCode) throw new Error('OTP not generated');
      otpCode = encryptionService.decrypt(user.otpCode);
    });

    it('/auth/register (POST) - should return 400 if user already exists', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: newEmail,
          password,
          firstName: 'Another',
          lastName: 'User',
        })
        .expect(400);
    });

    it('/auth/verify-otp (POST) - should return 401 for invalid OTP', async () => {
      await request(app.getHttpServer())
        .post('/auth/verify-otp')
        .send({
          email: newEmail,
          otpCode: '000000', // Wrong OTP
        })
        .expect(401);
    });

    it('/auth/verify-otp (POST) - should return 200 for valid OTP', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/verify-otp')
        .send({
          email: newEmail,
          otpCode,
        })
        .expect(200);

      expect(response.body).toHaveProperty(
        'message',
        'Email verified. Account pending admin approval.',
      );

      // Verify user status updated
      const user = await userModel.findOne({ email: newEmail });
      expect(user?.status).toBe(UserStatus.PENDING);
    });
  });

  it('/auth/login (POST) - should return access token with valid credentials', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: userEmail, password: userPassword })
      .expect(200);

    expect(response.body).toHaveProperty('accessToken');
    const body = response.body as { accessToken: string };
    expect(typeof body.accessToken).toBe('string');
  });

  it('/auth/login (POST) - should return 401 with invalid password', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: userEmail, password: 'wrongpassword' })
      .expect(401);
  });

  it('/auth/login (POST) - should return 401 with non-existent email', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'nonexistent@example.com', password: userPassword })
      .expect(401);
  });

  it('/auth/login (POST) - should return 400 with invalid email format', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'not-an-email', password: userPassword })
      .expect(400);
  });
});
