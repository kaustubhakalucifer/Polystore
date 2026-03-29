import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {
  LoginRequestDto,
  LoginResponseDto,
  RegisterRequestDto,
  VerifyOtpRequestDto,
  AuthMessageResponseDto,
} from '../dtos/auth.dto';
import { environment } from '../../../environments/environment';

export interface UserPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  public currentUser = signal<UserPayload | null>(null);

  constructor() {
    this.loadUserFromToken();
  }

  private loadUserFromToken(): void {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.currentUser.set({
          sub: payload.sub,
          email: payload.email,
          role: payload.role,
        });
      } catch {
        localStorage.removeItem('accessToken');
        this.currentUser.set(null);
      }
    }
  }

  /**
   * Logs in a user.
   * @param credentials The login credentials (email, password).
   * @returns An Observable containing the access token upon successful login.
   */
  login(credentials: LoginRequestDto): Observable<LoginResponseDto> {
    return this.http.post<LoginResponseDto>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => {
        localStorage.setItem('accessToken', response.accessToken);
        this.loadUserFromToken();
      }),
    );
  }

  /**
   * Logs out the user.
   */
  logout(): void {
    localStorage.removeItem('accessToken');
    this.currentUser.set(null);
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
