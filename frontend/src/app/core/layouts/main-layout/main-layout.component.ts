import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';
import { OrganizationContextService } from '../../services/organization-context.service';
import { ThemeToggleComponent } from '../../../shared/components/theme-toggle/theme-toggle.component';
import { getAvatarColor } from '../../utils/avatar.util';
import { PlatformRole } from '../../enums/platform-role.enum';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ThemeToggleComponent],
  templateUrl: './main-layout.component.html',
})
export class MainLayoutComponent implements OnInit {
  public themeService = inject(ThemeService);
  public authService = inject(AuthService);
  public orgContext = inject(OrganizationContextService);
  private router = inject(Router);

  mobileMenuOpen = false;
  orgDropdownOpen = false;

  get isSuperAdmin(): boolean {
    return this.authService.currentUser()?.role === PlatformRole.SUPER_ADMIN;
  }

  get isTenantAdmin(): boolean {
    return this.authService.currentUser()?.role === PlatformRole.TENANT_ADMIN;
  }

  ngOnInit(): void {
    if (this.isTenantAdmin) {
      this.orgContext.loadOrganizations();
    }
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  toggleOrgDropdown(): void {
    this.orgDropdownOpen = !this.orgDropdownOpen;
  }

  closeOrgDropdown(): void {
    this.orgDropdownOpen = false;
  }

  switchOrganization(orgId: string): void {
    this.orgContext.setActiveOrganization(orgId);
    this.closeOrgDropdown();
    this.router.navigate(['/org', orgId, 'drive']);
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
