import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';

jest.mock('bcryptjs');
import { UsersService } from '../users/users.service';
import { PlatformRole, UserStatus } from '../../core/enums';
import { UserDocument } from '../users/schemas/user.schema';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const mockUsersService = {
      findByEmail: jest.fn(),
    };

    const mockJwtService = {
      signAsync: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
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
