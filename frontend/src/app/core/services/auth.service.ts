import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  LoginRequestDto,
  LoginResponseDto,
  RegisterRequestDto,
  VerifyOtpRequestDto,
  AuthMessageResponseDto,
} from '../dtos/auth.dto';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  /**
   * Logs in an admin user.
   * @param credentials The login credentials (email, password).
   * @returns An Observable containing the access token upon successful login.
   */
  loginAdmin(credentials: LoginRequestDto): Observable<LoginResponseDto> {
    return this.http.post<LoginResponseDto>(`${this.apiUrl}/login`, credentials);
  }

  /**
   * Registers a new user.
   * @param data The user registration details.
   * @returns An Observable containing a success message.
   */
  register(data: RegisterRequestDto): Observable<AuthMessageResponseDto> {
    return this.http.post<AuthMessageResponseDto>(`${this.apiUrl}/register`, data);
  }

  /**
   * Verifies the OTP sent to the user's email.
   * @param data The email and OTP code.
   * @returns An Observable containing a success message.
   */
  verifyOtp(data: VerifyOtpRequestDto): Observable<AuthMessageResponseDto> {
    return this.http.post<AuthMessageResponseDto>(`${this.apiUrl}/verify-otp`, data);
  }
}
