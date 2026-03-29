import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { PlatformRole } from '../enums/platform-role.enum';

export const platformRoleGuard = (allowedRoles: PlatformRole[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const user = authService.currentUser();

    if (user && allowedRoles.includes(user.role as PlatformRole)) {
      return true;
    }

    // Redirect to login if not authorized
    return router.createUrlTree(user ? ['/'] : ['/login']);
  };
};
