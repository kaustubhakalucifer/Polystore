import { Component, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { PlatformRole } from '../../core/enums/platform-role.enum';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastService = inject(ToastService);

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
      .login({
        email: this.loginForm.controls.email.value,
        password: this.loginForm.controls.password.value,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          const role = this.authService.currentUser()?.role;
          if (role === PlatformRole.SUPER_ADMIN) {
            this.router.navigate(['/admin']);
          } else if (role === PlatformRole.TENANT_ADMIN) {
            this.router.navigate(['/organizations']);
          } else {
            this.loginForm.enable();
            this.toastService.show('Logged in successfully.', 'success');
            this.router.navigate(['/']);
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          this.loginForm.enable();
          const msg =
            err.error?.message || 'Login failed. Please check your credentials and try again.';

          if (msg && typeof msg === 'object' && 'code' in msg) {
            const errorObj = msg as { code?: string; message?: string; text?: string };
            if (errorObj.code === 'PENDING_APPROVAL') {
              this.toastService.show(
                errorObj.message || errorObj.text || 'Pending approval.',
                'info',
                5000,
              );
            } else {
              this.errorMessage.set(errorObj.message || errorObj.text || 'Login failed.');
            }
          } else if (typeof msg === 'string' && msg.includes('queue for approval')) {
            this.toastService.show(msg, 'info', 5000);
          } else {
            this.errorMessage.set(typeof msg === 'string' ? msg : 'Login failed.');
          }
        },
      });
  }
}
