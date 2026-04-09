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

  public organizations = computed(() => this._organizations());
  public activeOrgId = computed(() => this._activeOrgId());
  
  public activeOrganization = computed(() => {
    const orgs = this._organizations();
    const id = this._activeOrgId();
    return orgs.find(org => org._id === id) || null;
  });

  public loadOrganizations(): void {
    this.organizationService.getOrganizations().subscribe({
      next: (res) => {
        this._organizations.set(res.data);
      },
      error: (err) => console.error('Failed to load organizations context', err)
    });
  }

  public setActiveOrganization(orgId: string): void {
    localStorage.setItem('active_org_id', orgId);
    this._activeOrgId.set(orgId);
  }
}
