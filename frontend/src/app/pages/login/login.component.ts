import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private fb = inject(NonNullableFormBuilder);
  private router = inject(Router);

  public loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  public onSubmit(): void {
    if (this.loginForm.valid) {
      // Dummy authentication: proceed to admin
      console.log('Login credentials:', this.loginForm.value);
      this.router.navigate(['/admin']);
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
}
