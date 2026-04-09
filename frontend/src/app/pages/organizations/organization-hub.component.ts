import { Component, OnInit, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { OrganizationService } from './organization.service';
import { OrganizationContextService } from '../../core/services/organization-context.service';
import { Organization } from './organization.interface';
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
  private orgContextService = inject(OrganizationContextService);
  private fb = inject(NonNullableFormBuilder);
  private router = inject(Router);

  organizations = signal<Organization[]>([]);
  isLoading = signal<boolean>(true);
  isModalOpen = signal<boolean>(false);
  isCreating = signal<boolean>(false);

  createOrgForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
  });

  ngOnInit(): void {
    // Optionally we can also update context organizations here or just let the main layout handle it.
    // We'll keep local component state for loading for now, but also update the global context.
    this.organizationService.getOrganizations().subscribe({
      next: (response) => {
        this.organizations.set(response.data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load organizations', err);
        this.isLoading.set(false);
      },
    });
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
        next: (response) => {
          this.organizations.update((orgs) => [...orgs, response.data]);
          // Refresh context to include new org in topbar
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
