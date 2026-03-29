import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.currentUser();

  if (user && user.role === 'SUPER_ADMIN') {
    return true;
  }

  // Redirect to normal admin dashboard or login if not authorized as super admin
  return router.createUrlTree(user ? ['/admin'] : ['/login']);
};
