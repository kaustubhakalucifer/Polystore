import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class OtpService {
  /**
   * Generates a secure random numeric string of the specified length.
   * @param length The length of the OTP (default is 6)
   * @returns The generated OTP string
   */
  generateOtp(length: number = 6): string {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    const randomValue = crypto.randomInt(min, max + 1);
    return randomValue.toString();
  }

  /**
   * Calculates the expiry date for an OTP.
   * @param minutes The number of minutes until the OTP expires (default is 15)
   * @returns A Date object representing the expiry time
   */
  calculateExpiry(minutes: number = 15): Date {
    const expiryDate = new Date();
    expiryDate.setMinutes(expiryDate.getMinutes() + minutes);
    return expiryDate;
  }

  /**
   * Verifies an input OTP against a stored OTP and checks for expiration.
   * @param inputOtp The OTP provided by the user
   * @param dbOtp The OTP stored in the database
   * @param expiresAt The expiration date of the stored OTP
   * @returns True if the OTP matches and is not expired, false otherwise
   */
  verifyOtp(inputOtp: string, dbOtp: string, expiresAt: Date): boolean {
    if (inputOtp !== dbOtp) {
      return false;
    }

    if (new Date() > expiresAt) {
      return false;
    }

    return true;
  }
}
