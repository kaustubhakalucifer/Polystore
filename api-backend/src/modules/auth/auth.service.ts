import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { EmailService } from '../../core/email/email.service';
import { OtpService } from '../../core/otp/otp.service';
import { PlatformRole, UserStatus } from '../../core/enums';
import { LoginDto } from './dto/login.dto';
import { RegisterUserDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { EncryptionService } from '../../core/encryption/encryption.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly encryptionService: EncryptionService,
    private readonly otpService: OtpService,
  ) {}

  async register(registerDto: RegisterUserDto): Promise<void> {
    const existingUser = await this.usersService.findByEmail(
      registerDto.email.toLowerCase(),
    );
    if (existingUser && existingUser.status !== UserStatus.UNVERIFIED) {
      throw new BadRequestException('User already exists');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 10);
    const otpCode = this.otpService.generateOtp(6);
    const otpExpiresAt = this.otpService.calculateExpiry(15);

    // Encrypt the OTP code before storing
    const encryptedOtpCode = this.encryptionService.encrypt(otpCode);

    if (existingUser && existingUser.status === UserStatus.UNVERIFIED) {
      existingUser.passwordHash = passwordHash;
      existingUser.firstName = registerDto.firstName;
      existingUser.lastName = registerDto.lastName;
      existingUser.otpCode = encryptedOtpCode;
      existingUser.otpExpiresAt = otpExpiresAt;
      await existingUser.save();
    } else {
      await this.usersService.create({
        email: registerDto.email.toLowerCase(),
        passwordHash,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        platformRole: PlatformRole.TENANT_ADMIN,
        status: UserStatus.UNVERIFIED,
        otpCode: encryptedOtpCode,
        otpExpiresAt,
      });
    }

    await this.emailService.sendOtp(registerDto.email, otpCode);
  }

  async verifyOtp(verifyDto: VerifyOtpDto): Promise<void> {
    const user = await this.usersService.findByEmailWithOtp(
      verifyDto.email.toLowerCase(),
    );
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.status !== UserStatus.UNVERIFIED) {
      throw new BadRequestException(
        'User is already verified or in an invalid state',
      );
    }

    let decryptedOtpCode: string;
    try {
      decryptedOtpCode = this.encryptionService.decrypt(user.otpCode!);
    } catch {
      throw new UnauthorizedException('Invalid OTP');
    }

    const isOtpValid = this.otpService.verifyOtp(
      verifyDto.otpCode,
      decryptedOtpCode,
      user.otpExpiresAt!,
    );

    if (!isOtpValid) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    user.status = UserStatus.PENDING;
    user.otpCode = undefined;
    user.otpExpiresAt = undefined;

    await user.save();
  }

  async login(loginDto: LoginDto): Promise<{ accessToken: string }> {
    const user = await this.usersService.findByEmailWithPassword(
      loginDto.email.toLowerCase(),
    );

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === UserStatus.PENDING) {
      throw new UnauthorizedException(
        "You're in queue for approval. Please wait for an administrator to activate your account.",
      );
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.platformRole,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
    };
  }
}
