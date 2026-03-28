import { Component, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  public isLoading = signal(false);
  public errorMessage = signal<string | null>(null);
  public showPassword = signal(false);

  public loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  public togglePasswordVisibility(): void {
    this.showPassword.update((show) => !show);
  }

  public onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.loginForm.disable();

    this.authService
      .loginAdmin({
        email: this.loginForm.controls.email.value,
        password: this.loginForm.controls.password.value,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          localStorage.setItem('accessToken', response.accessToken);
          this.isLoading.set(false);
          this.router.navigate(['/admin']);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.loginForm.enable();
          const msg =
            err.error?.message || 'Login failed. Please check your credentials and try again.';
          this.errorMessage.set(msg);
        },
      });
  }
}
