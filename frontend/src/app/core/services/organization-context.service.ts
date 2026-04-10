import { Injectable, computed, signal, inject } from '@angular/core';
import { Organization } from '../../pages/organizations/organization.interface';
import { OrganizationService } from '../../pages/organizations/organization.service';

@Injectable({
  providedIn: 'root'
})
export class OrganizationContextService {
  private organizationService = inject(OrganizationService);
  
  private _organizations = signal<Organization[]>([]);
  private _activeOrgId = signal<string | null>(localStorage.getItem('active_org_id'));
  private _isLoading = signal<boolean>(false);
  private _error = signal<string | null>(null);

  public organizations = computed(() => this._organizations());
  public activeOrgId = computed(() => this._activeOrgId());
  public isLoading = computed(() => this._isLoading());
  public error = computed(() => this._error());
  
  public activeOrganization = computed(() => {
    const orgs = this._organizations();
    const id = this._activeOrgId();
    return orgs.find(org => org._id === id) || null;
  });

  public loadOrganizations(): void {
    this._isLoading.set(true);
    this._error.set(null);
    this.organizationService.getOrganizations().subscribe({
      next: (res) => {
        this._organizations.set(res.data);
        this._isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load organizations context', err);
        this._error.set('Failed to load organizations');
        this._isLoading.set(false);
      }
    });
  }

  public setActiveOrganization(orgId: string): void {
    localStorage.setItem('active_org_id', orgId);
    this._activeOrgId.set(orgId);
  }
}
