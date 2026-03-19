import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from '../src/modules/users/schemas/user.schema';
import { PlatformRole, UserStatus } from '../src/core/enums';

describe('AdminUsersController (e2e)', () => {
  let app: INestApplication<App>;
  let userModel: Model<UserDocument>;
  let accessToken: string;
  let normalAccessToken: string;
  let pendingUserIdApprove: string;
  let pendingUserIdReject: string;

  const adminEmail = 'admin@example.com';
  const normalEmail = 'user@example.com';
  const pendingEmailApprove = 'pending-approve@example.com';
  const pendingEmailReject = 'pending-reject@example.com';
  const password = 'password123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    userModel = moduleFixture.get<Model<UserDocument>>(
      getModelToken(User.name),
    );

    // Clear existing users from test DB
    await userModel.deleteMany({});

    const passwordHash = await bcrypt.hash(password, 10);

    // Create Super Admin
    await userModel.create({
      email: adminEmail,
      passwordHash,
      platformRole: PlatformRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      firstName: 'Admin',
      lastName: 'User',
    });

    // Create Normal User
    await userModel.create({
      email: normalEmail,
      passwordHash,
      platformRole: PlatformRole.USER,
      status: UserStatus.ACTIVE,
      firstName: 'Normal',
      lastName: 'User',
    });

    // Create Pending User for Approve test
    const pendingUserApprove = await userModel.create({
      email: pendingEmailApprove,
      passwordHash,
      platformRole: PlatformRole.USER,
      status: UserStatus.PENDING,
      firstName: 'Pending',
      lastName: 'Approve',
    });

    pendingUserIdApprove = (
      pendingUserApprove._id as unknown as string
    ).toString();

    // Create Pending User for Reject test
    const pendingUserReject = await userModel.create({
      email: pendingEmailReject,
      passwordHash,
      platformRole: PlatformRole.USER,
      status: UserStatus.PENDING,
      firstName: 'Pending',
      lastName: 'Reject',
    });

    pendingUserIdReject = (
      pendingUserReject._id as unknown as string
    ).toString();

    // Log in as Super Admin
    const adminRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: adminEmail, password });

    expect(adminRes.status).toBe(200);
    expect(adminRes.body).toHaveProperty('accessToken');
    const adminBody = adminRes.body as { accessToken: string };
    expect(typeof adminBody.accessToken).toBe('string');
    expect(adminBody.accessToken.length).toBeGreaterThan(0);
    accessToken = adminBody.accessToken;

    // Log in as Normal User
    const userRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: normalEmail, password });

    expect(userRes.status).toBe(200);
    expect(userRes.body).toHaveProperty('accessToken');
    const userBody = userRes.body as { accessToken: string };
    expect(typeof userBody.accessToken).toBe('string');
    expect(userBody.accessToken.length).toBeGreaterThan(0);
    normalAccessToken = userBody.accessToken;
  });

  afterAll(async () => {
    await userModel.deleteMany({});
    await app.close();
  });

  describe('Admin Users API', () => {
    it('/api/admin/users (GET) - should fail if unauthenticated', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/users/waitlisted')
        .expect(401);
    });

    it('/api/admin/users (GET) - should fail if not SUPER_ADMIN', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/users/waitlisted')
        .set('Authorization', `Bearer ${normalAccessToken}`)
        .expect(403);
    });

    it('/api/admin/users (GET) - should get waitlisted users', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/users/waitlisted')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const body = response.body as { status: UserStatus }[];
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);
      expect(body[0].status).toBe(UserStatus.PENDING);
    });

    it('/api/admin/users/:id/approve (PATCH) - should approve user', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/admin/users/${pendingUserIdApprove}/approve`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const body = response.body as { status: UserStatus };
      expect(body.status).toBe(UserStatus.ACTIVE);
    });

    it('/api/admin/users/:id/reject (PATCH) - should reject user', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/admin/users/${pendingUserIdReject}/reject`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const body = response.body as { status: UserStatus };
      expect(body.status).toBe(UserStatus.REJECTED);
    });

    it('/api/admin/users/:id/approve (PATCH) - should fail on invalid mongo ID', async () => {
      await request(app.getHttpServer())
        .patch('/api/admin/users/invalid-id/approve')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });
  });
});
