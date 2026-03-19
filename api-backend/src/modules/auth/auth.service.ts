import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { EmailService } from '../../core/email/email.service';
import { User, UserDocument } from '../users/schemas/user.schema';
import { PlatformRole, UserStatus } from '../../core/enums';
import { LoginDto } from './dto/login.dto';
import { RegisterUserDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { EncryptionService } from '../../core/encryption/encryption.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly encryptionService: EncryptionService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async register(registerDto: RegisterUserDto): Promise<void> {
    const existingUser = await this.userModel.findOne({
      email: registerDto.email.toLowerCase(),
    });
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 10);
    const otpCode = crypto.randomInt(100000, 1000000).toString();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

    // Encrypt the OTP code before storing
    const encryptedOtpCode = this.encryptionService.encrypt(otpCode);

    const newUser = new this.userModel({
      email: registerDto.email.toLowerCase(),
      passwordHash,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      platformRole: PlatformRole.TENANT_ADMIN,
      status: UserStatus.UNVERIFIED,
      otpCode: encryptedOtpCode,
      otpExpiresAt,
    });

    await newUser.save();
    await this.emailService.sendOtp(registerDto.email, otpCode);
  }

  async verifyOtp(verifyDto: VerifyOtpDto): Promise<void> {
    const user = await this.userModel
      .findOne({ email: verifyDto.email.toLowerCase() })
      .select('+otpCode +otpExpiresAt');
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

    if (decryptedOtpCode !== verifyDto.otpCode) {
      throw new UnauthorizedException('Invalid OTP');
    }

    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      throw new UnauthorizedException('OTP has expired');
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

    if (!user || !user.passwordHash || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user._id,
      email: user.email,
      role: user.platformRole,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
    };
  }
}
