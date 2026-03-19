import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';

jest.mock('bcryptjs');
import { UsersService } from '../users/users.service';
import { EmailService } from '../../core/email/email.service';
import { EncryptionService } from '../../core/encryption/encryption.service';
import { OtpService } from '../../core/otp/otp.service';
import { PlatformRole, UserStatus } from '../../core/enums';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: {
    findByEmail: jest.Mock;
    findByEmailWithPassword: jest.Mock;
    findByEmailWithOtp: jest.Mock;
    create: jest.Mock;
  };
  let jwtService: { signAsync: jest.Mock };
  let emailService: { sendOtp: jest.Mock };
  let otpService: {
    generateOtp: jest.Mock;
    calculateExpiry: jest.Mock;
    verifyOtp: jest.Mock;
  };

  beforeEach(async () => {
    const mockUsersService = {
      findByEmail: jest.fn(),
      findByEmailWithPassword: jest.fn(),
      findByEmailWithOtp: jest.fn(),
      create: jest.fn(),
    };

    const mockJwtService = {
      signAsync: jest.fn(),
    };

    const mockEmailService = {
      sendOtp: jest.fn(),
    };

    const mockEncryptionService = {
      encrypt: jest
        .fn()
        .mockImplementation((val: string) => `encrypted_${val}`),
      decrypt: jest
        .fn()
        .mockImplementation((val: string) => val.replace('encrypted_', '')),
    };

    const mockOtpService = {
      generateOtp: jest.fn().mockReturnValue('123456'),
      calculateExpiry: jest
        .fn()
        .mockReturnValue(new Date(Date.now() + 15 * 60 * 1000)),
      verifyOtp: jest.fn().mockImplementation((input, db, expiry) => {
        if (input !== db) return false;
        if (new Date() > expiry) return false;
        return true;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: EncryptionService, useValue: mockEncryptionService },
        { provide: OtpService, useValue: mockOtpService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    emailService = module.get(EmailService);
    otpService = module.get(OtpService);
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should throw BadRequestException if user already exists', async () => {
      usersService.findByEmail.mockResolvedValue({ _id: 'existingId' });

      await expect(authService.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(jest.mocked(usersService.findByEmail)).toHaveBeenCalledWith(
        registerDto.email,
      );
    });

    it('should successfully register a user and send OTP', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      await authService.register(registerDto);

      expect(jest.mocked(usersService.findByEmail)).toHaveBeenCalledWith(
        registerDto.email,
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(usersService.create).toHaveBeenCalled();
      expect(jest.mocked(emailService.sendOtp)).toHaveBeenCalledWith(
        registerDto.email,
        expect.any(String),
      );
      expect(otpService.generateOtp).toHaveBeenCalled();
      expect(otpService.calculateExpiry).toHaveBeenCalled();
    });
  });

  describe('verifyOtp', () => {
    const verifyDto = { email: 'test@example.com', otpCode: '123456' };

    it('should throw BadRequestException if user not found', async () => {
      usersService.findByEmailWithOtp.mockResolvedValue(null);

      await expect(authService.verifyOtp(verifyDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if user status is not UNVERIFIED', async () => {
      usersService.findByEmailWithOtp.mockResolvedValue({
        status: UserStatus.PENDING,
      });

      await expect(authService.verifyOtp(verifyDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw UnauthorizedException if OTP does not match', async () => {
      const mockUser = {
        status: UserStatus.UNVERIFIED,
        otpCode: 'encrypted_654321', // does not match 123456
        otpExpiresAt: new Date(Date.now() + 100000), // not expired
      };
      usersService.findByEmailWithOtp.mockResolvedValue(mockUser);

      await expect(authService.verifyOtp(verifyDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if OTP has expired', async () => {
      const mockUser = {
        status: UserStatus.UNVERIFIED,
        otpCode: 'encrypted_123456',
        otpExpiresAt: new Date(Date.now() - 1000), // Expired
      };
      usersService.findByEmailWithOtp.mockResolvedValue(mockUser);

      await expect(authService.verifyOtp(verifyDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should update user status to PENDING on successful verification', async () => {
      const mockUser = {
        status: UserStatus.UNVERIFIED,
        otpCode: 'encrypted_123456',
        otpExpiresAt: new Date(Date.now() + 10000), // Not expired
        save: jest.fn().mockResolvedValue(true),
      };
      usersService.findByEmailWithOtp.mockResolvedValue(mockUser);

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
        _id: 'user123',
        email: loginDto.email,
        passwordHash: 'hashedPassword',
        status: UserStatus.ACTIVE,
        platformRole: PlatformRole.TENANT_ADMIN,
      };

      usersService.findByEmailWithPassword.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.signAsync.mockResolvedValue('jwt-token');

      const result = await authService.login(loginDto);

      expect(result).toEqual({ accessToken: 'jwt-token' });
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 'user123',
        email: mockUser.email,
        role: mockUser.platformRole,
      });
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      const mockUser = {
        _id: 'user123',
        email: loginDto.email,
        passwordHash: 'hashedPassword',
        status: UserStatus.ACTIVE,
      };

      usersService.findByEmailWithPassword.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
