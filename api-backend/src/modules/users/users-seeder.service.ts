import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from 'src/config/config.service';
import { User, UserDocument } from './schemas/user.schema';
import { PlatformRole, UserStatus } from 'src/core/enums';

@Injectable()
export class UsersSeederService implements OnModuleInit {
  private readonly logger = new Logger(UsersSeederService.name);
  private readonly bcryptSaltRounds = 10;

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedSuperAdmin();
  }

  /**
   * Seeds the Super Admin user if one does not already exist.
   * This method runs automatically on module initialization to prevent
   * the "chicken and egg" problem of onboarding the first Super Admin.
   */
  private async seedSuperAdmin(): Promise<void> {
    const superAdminEmail = this.configService.get('SUPER_ADMIN_EMAIL');
    const superAdminPassword = this.configService.get('SUPER_ADMIN_PASSWORD');

    // Skip seeding if credentials are not configured
    if (!superAdminEmail || !superAdminPassword) {
      this.logger.warn(
        'SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD not configured. Skipping Super Admin seeding.',
      );
      return;
    }

    // Check if a Super Admin already exists
    const existingSuperAdmin = await this.userModel.findOne({
      platformRole: PlatformRole.SUPER_ADMIN,
    });

    if (existingSuperAdmin) {
      this.logger.log(
        'Super Admin already exists. Skipping seeding to remain idempotent.',
      );
      return;
    }

    // Hash the password using bcrypt
    let passwordHash: string;
    try {
      passwordHash = await bcrypt.hash(
        superAdminPassword,
        this.bcryptSaltRounds,
      );
    } catch (error) {
      this.logger.error('Failed to hash password', error);
      throw new Error('Failed to hash Super Admin password');
    }

    // Create the Super Admin user
    const superAdmin = new this.userModel({
      email: superAdminEmail.toLowerCase().trim(),
      passwordHash,
      platformRole: PlatformRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      firstName: 'Super',
      lastName: 'Admin',
    });

    await superAdmin.save();

    this.logger.log(
      `Super Admin created successfully with email: ${superAdminEmail}`,
    );
  }
}
