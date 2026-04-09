import { Component, inject } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';
import { ThemeToggleComponent } from '../../../shared/components/theme-toggle/theme-toggle.component';
import { getAvatarColor } from '../../utils/avatar.util';
import { PlatformRole } from '../../enums/platform-role.enum';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ThemeToggleComponent],
  templateUrl: './main-layout.component.html',
})
export class MainLayoutComponent {
  public themeService = inject(ThemeService);
  public authService = inject(AuthService);
  private router = inject(Router);

  mobileMenuOpen = false;

  get isSuperAdmin(): boolean {
    return this.authService.currentUser()?.role === PlatformRole.SUPER_ADMIN;
  }

  get isTenantAdmin(): boolean {
    return this.authService.currentUser()?.role === PlatformRole.TENANT_ADMIN;
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getInitials(): string {
    const user = this.authService.currentUser();
    if (user?.firstName) {
      return user.firstName.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return '?';
  }

  getUserAvatarColor(): string {
    const user = this.authService.currentUser();
    const str = user?.firstName || user?.email || 'A';
    return getAvatarColor(str);
  }
}
