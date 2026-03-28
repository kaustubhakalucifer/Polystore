import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // We only care about specific HTTP status codes for our global handler
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401 || error.status === 403) {
          // If the server provides a specific error message, we display it.
          // Otherwise, we provide a helpful fallback, such as when an account is unverified/pending.
          const serverMessage = typeof error.error?.message === 'string' 
            ? error.error.message 
            : (Array.isArray(error.error?.message) ? error.error.message.join(', ') : null);

          // Example: Fallback message hinting at account approval
          const defaultMessage = error.status === 401 
            ? 'Unauthorized: Invalid credentials or account pending admin approval.' 
            : 'Forbidden: You do not have permission to access this resource.';

          toastService.show(serverMessage || defaultMessage, 'error', 5000);

          // Automatically clear token and redirect if unauthorized and not on login page
          if (error.status === 401 && !req.url.includes('/login')) {
            localStorage.removeItem('accessToken');
            router.navigate(['/login']);
          }
        } else if (error.status >= 500) {
          toastService.show('An unexpected server error occurred.', 'error', 5000);
          } else if (error.status === 400) {
          const badRequestMsg = typeof error.error?.message === 'string' 
            ? error.error.message 
            : (Array.isArray(error.error?.message) ? error.error.message.join(', ') : 'Bad request. Please check your input.');
          toastService.show(badRequestMsg, 'warning', 4000);
        }
      }

      return throwError(() => error);
    })
  );
};
