import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  sendOtp(email: string, otpCode: string): Promise<void> {
    // Mocking email sending
    this.logger.log(`[MOCK EMAIL] Sent OTP ${otpCode} to ${email}`);
    return Promise.resolve();
  }
}
