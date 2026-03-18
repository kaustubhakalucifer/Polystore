import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';

jest.mock('bcryptjs');
import { UsersService } from '../users/users.service';
import { EmailService } from '../../core/email/email.service';
import { PlatformRole, UserStatus } from '../../core/enums';
import { User, UserDocument } from '../users/schemas/user.schema';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let emailService: jest.Mocked<EmailService>;
  let userModel: Model<UserDocument>;

  beforeEach(async () => {
    const mockUsersService = {
      findByEmail: jest.fn(),
    };

    const mockJwtService = {
      signAsync: jest.fn(),
    };

    const mockEmailService = {
      sendOtp: jest.fn(),
    };

    const mockUserModel = {
      findOne: jest.fn(),
    };

    // To properly mock `new this.userModel()`

    const MockUserModelConstructor = function (this: any, data: any) {
      Object.assign(this, data);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.save = jest.fn().mockResolvedValue(this);
    };
    MockUserModelConstructor.findOne = mockUserModel.findOne;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: EmailService, useValue: mockEmailService },
        {
          provide: getModelToken(User.name),
          useValue: MockUserModelConstructor,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    emailService = module.get(EmailService);
    userModel = module.get(getModelToken(User.name));
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should throw BadRequestException if user already exists', async () => {
      (userModel.findOne as jest.Mock).mockResolvedValue({ _id: 'existingId' });

      await expect(authService.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(userModel.findOne as jest.Mock).toHaveBeenCalledWith({
        email: registerDto.email,
      });
    });

    it('should successfully register a user and send OTP', async () => {
      (userModel.findOne as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      await authService.register(registerDto);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(userModel.findOne as jest.Mock).toHaveBeenCalledWith({
        email: registerDto.email,
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(emailService.sendOtp).toHaveBeenCalledWith(
        registerDto.email,
        expect.any(String),
      );
    });
  });

  describe('verifyOtp', () => {
    const verifyDto = { email: 'test@example.com', otpCode: '123456' };

    it('should throw BadRequestException if user not found', async () => {
      const mockFindOne = { select: jest.fn().mockResolvedValue(null) };
      (userModel.findOne as jest.Mock).mockReturnValue(mockFindOne);

      await expect(authService.verifyOtp(verifyDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if user status is not UNVERIFIED', async () => {
      const mockFindOne = {
        select: jest.fn().mockResolvedValue({ status: UserStatus.PENDING }),
      };
      (userModel.findOne as jest.Mock).mockReturnValue(mockFindOne);

      await expect(authService.verifyOtp(verifyDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw UnauthorizedException if OTP does not match', async () => {
      const mockUser = {
        status: UserStatus.UNVERIFIED,
        otpCode: '654321',
      };
      const mockFindOne = { select: jest.fn().mockResolvedValue(mockUser) };
      (userModel.findOne as jest.Mock).mockReturnValue(mockFindOne);

      await expect(authService.verifyOtp(verifyDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if OTP has expired', async () => {
      const mockUser = {
        status: UserStatus.UNVERIFIED,
        otpCode: '123456',
        otpExpiresAt: new Date(Date.now() - 1000), // Expired
      };
      const mockFindOne = { select: jest.fn().mockResolvedValue(mockUser) };
      (userModel.findOne as jest.Mock).mockReturnValue(mockFindOne);

      await expect(authService.verifyOtp(verifyDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should update user status to PENDING on successful verification', async () => {
      const mockUser = {
        status: UserStatus.UNVERIFIED,
        otpCode: '123456',
        otpExpiresAt: new Date(Date.now() + 10000), // Valid
        save: jest.fn().mockResolvedValue(true),
      };
      const mockFindOne = { select: jest.fn().mockResolvedValue(mockUser) };
      (userModel.findOne as jest.Mock).mockReturnValue(mockFindOne);

      await authService.verifyOtp(verifyDto);

      expect(mockUser.status).toBe(UserStatus.PENDING);
      expect(mockUser.otpCode).toBeUndefined();
      expect(mockUser.otpExpiresAt).toBeUndefined();
      expect(mockUser.save).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto = { email: 'test@example.com', password: 'password123' };

    it('should return a token if credentials are valid', async () => {
      const mockUser = {
        _id: 'userId123',
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
        platformRole: PlatformRole.USER,
        status: UserStatus.ACTIVE,
      };

      usersService.findByEmail.mockResolvedValue(
        mockUser as unknown as UserDocument,
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.signAsync.mockResolvedValue('testAccessToken');

      const result = await authService.login(loginDto);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.passwordHash,
      );
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: mockUser._id,
        email: mockUser.email,
        role: mockUser.platformRole,
      });
      expect(result).toEqual({ accessToken: 'testAccessToken' });
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      const mockUser = {
        _id: 'userId123',
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
      };

      usersService.findByEmail.mockResolvedValue(
        mockUser as unknown as UserDocument,
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
