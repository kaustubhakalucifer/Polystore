import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { platformRoleGuard } from './core/guards/platform-role.guard';
import { PlatformRole } from './core/enums/platform-role.enum';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },
  {
    path: '',
    loadComponent: () =>
      import('./core/layouts/auth-layout/auth-layout.component').then((m) => m.AuthLayoutComponent),
    children: [
      {
        path: 'login',
        loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./pages/register/register.component').then((m) => m.RegisterComponent),
      },
    ],
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./core/layouts/main-layout/main-layout.component').then((m) => m.MainLayoutComponent),
    canActivate: [authGuard, platformRoleGuard([PlatformRole.SUPER_ADMIN])],
    children: [
      {
        path: '',
        loadChildren: () => import('./pages/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
      },
    ],
  },
  {
    path: 'organizations',
    loadComponent: () =>
      import('./core/layouts/main-layout/main-layout.component').then((m) => m.MainLayoutComponent),
    canActivate: [authGuard, platformRoleGuard([PlatformRole.TENANT_ADMIN])],
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/organizations/organization-hub.component').then((m) => m.OrganizationHubComponent),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '/login',
  },
];
