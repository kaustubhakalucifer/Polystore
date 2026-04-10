import { Component, OnInit, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { OrganizationService } from './organization.service';
import { OrganizationContextService } from '../../core/services/organization-context.service';
import { finalize } from 'rxjs/operators';

import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-organization-hub',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './organization-hub.component.html',
})
export class OrganizationHubComponent implements OnInit {
  private organizationService = inject(OrganizationService);
  public orgContextService = inject(OrganizationContextService);
  private fb = inject(NonNullableFormBuilder);
  private router = inject(Router);

  isModalOpen = signal<boolean>(false);
  isCreating = signal<boolean>(false);

  createOrgForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
  });

  ngOnInit(): void {
    if (this.orgContextService.organizations().length === 0 && !this.orgContextService.isLoading()) {
      this.orgContextService.loadOrganizations();
    }
  }

  openModal(): void {
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.createOrgForm.reset();
    this.isModalOpen.set(false);
  }

  onSubmit(): void {
    if (this.createOrgForm.invalid || this.isCreating()) return;

    const name = this.createOrgForm.getRawValue().name;
    const nameTrimmed = name?.trim();
    if (!nameTrimmed) {
      this.createOrgForm.controls.name.setErrors({ required: true });
      return;
    }

    this.isCreating.set(true);
    this.organizationService.createOrganization(nameTrimmed)
      .pipe(finalize(() => this.isCreating.set(false)))
      .subscribe({
        next: () => {
          // Refresh context to include new org in topbar and local view
          this.orgContextService.loadOrganizations();
          this.closeModal();
        },
        error: (err) => {
          console.error('Failed to create organization', err);
        },
      });
  }

  navigateToOrg(orgId: string): void {
    this.orgContextService.setActiveOrganization(orgId);
    this.router.navigate(['/org', orgId, 'drive']);
  }

  onCardKeydown(event: KeyboardEvent, orgId: string): void {
    if (event.key === 'Enter' || event.key === ' ') {
      if (event.key === ' ') {
        event.preventDefault();
      }
      this.navigateToOrg(orgId);
    }
  }
}
