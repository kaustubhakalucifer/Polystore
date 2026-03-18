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

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  let userModel: Model<User>;
  const userEmail = 'test@example.com';
  const userPassword = 'password123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    userModel = moduleFixture.get<Model<User>>(getModelToken(User.name));

    await userModel.deleteMany({ email: userEmail });

    const passwordHash = await bcrypt.hash(userPassword, 10);
    await userModel.create({
      email: userEmail,
      passwordHash,
      platformRole: PlatformRole.USER,
      status: UserStatus.ACTIVE,
      firstName: 'Test',
      lastName: 'User',
    });
  });

  afterAll(async () => {
    await userModel.deleteMany({ email: userEmail });
    await app.close();
  });

  it('/auth/login (POST) - should return access token with valid credentials', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: userEmail, password: userPassword })
      .expect(200);

    expect(response.body).toHaveProperty('accessToken');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(typeof response.body.accessToken).toBe('string');
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
