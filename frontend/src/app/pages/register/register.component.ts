import { Component, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth.service';

type RegisterState = 'register' | 'otp' | 'success';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  public currentState = signal<RegisterState>('register');
  public isLoading = signal(false);
  public errorMessage = signal<string | null>(null);
  public showPassword = signal(false);

  // Store email to pass to OTP step
  private registeredEmail = '';

  public registerForm = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  public otpForm = this.fb.group({
    otpCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  public togglePasswordVisibility(): void {
    this.showPassword.update((show) => !show);
  }

  public onRegisterSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.registerForm.disable();

    const formValues = this.registerForm.getRawValue();

    this.authService
      .register({
        email: formValues.email,
        password: formValues.password,
        firstName: formValues.firstName,
        lastName: formValues.lastName,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.registeredEmail = formValues.email;
          this.isLoading.set(false);
          this.registerForm.enable();
          this.currentState.set('otp');
        },
        error: (err) => {
          this.isLoading.set(false);
          this.registerForm.enable();
          const msg = err.error?.message || 'Registration failed. Please try again.';
          this.errorMessage.set(msg);
        },
      });
  }

  public onOtpSubmit(): void {
    if (this.otpForm.invalid) {
      this.otpForm.markAllAsTouched();
      return;
    }

    if (!this.registeredEmail) {
      this.errorMessage.set('Registration email is missing. Please start over.');
      this.otpForm.enable();
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.otpForm.disable();

    const otpCode = this.otpForm.controls.otpCode.value;

    this.authService
      .verifyOtp({
        email: this.registeredEmail,
        otpCode: otpCode,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.otpForm.enable();
          this.currentState.set('success');
        },
        error: (err) => {
          this.isLoading.set(false);
          this.otpForm.enable();
          const msg = err.error?.message || 'OTP Verification failed. Please try again.';
          this.errorMessage.set(msg);
        },
      });
  }
}
