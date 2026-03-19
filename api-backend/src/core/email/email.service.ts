import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '../../config/config.service';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.smtpHost,
      port: this.configService.smtpPort,
      auth: {
        user: this.configService.smtpUser,
        pass: this.configService.smtpPass,
      },
    });
  }

  async sendOtp(email: string, otpCode: string): Promise<void> {
    if (process.env.NODE_ENV === 'test') {
      this.logger.log(`[TEST EMAIL] Simulated OTP email to ${email}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.configService.smtpFrom,
        to: email,
        subject: 'Polystore - Verify your email',
        text: `Your OTP code is ${otpCode}. It is valid for 15 minutes.`,
      });
      this.logger.log(`OTP sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP to ${email}`, error);
      throw new Error('Could not send OTP email');
    }
  }
}
