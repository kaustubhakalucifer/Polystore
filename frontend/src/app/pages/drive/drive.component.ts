import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { OrganizationContextService } from '../../core/services/organization-context.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-drive',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-slate-50 dark:bg-black text-slate-900 dark:text-zinc-100 p-8 h-full">
      <div class="max-w-7xl mx-auto flex flex-col items-center justify-center py-32 text-center">
        <div class="w-16 h-16 bg-poly-100 dark:bg-poly-900/30 text-poly-600 dark:text-poly-400 rounded-2xl flex items-center justify-center mb-6">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
          </svg>
        </div>
        <h1 class="text-3xl font-bold tracking-tight mb-2">Organization Drive</h1>
        <p class="text-slate-500 dark:text-zinc-400 max-w-md">
          Welcome to the drive for Organization: <span class="font-mono text-poly-600 dark:text-poly-400 bg-poly-50 dark:bg-poly-900/20 px-2 py-0.5 rounded">{{ orgId }}</span>
        </p>
        
        <div class="mt-8 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 rounded-xl text-emerald-700 dark:text-emerald-400 text-sm font-medium">
          Navigation succeeded! Organization ID successfully stored in context.
        </div>
      </div>
    </div>
  `
})
export class DriveComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private orgContextService = inject(OrganizationContextService);
  private destroyRef = inject(DestroyRef);
  
  orgId: string | null = null;

  ngOnInit(): void {
    // Initial sync read
    const snapshotId = this.route.parent?.snapshot.paramMap.get('orgId') || this.route.snapshot.paramMap.get('orgId');
    if (snapshotId) {
      this.orgId = snapshotId;
      this.orgContextService.setActiveOrganization(snapshotId);
    }

    // Subscribe to param changes
    if (this.route.parent) {
      this.route.parent.paramMap
        .pipe(
          map(params => params.get('orgId')),
          distinctUntilChanged(),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe(orgId => {
          if (orgId && orgId !== this.orgId) {
            this.orgId = orgId;
            this.orgContextService.setActiveOrganization(orgId);
          }
        });
    }
  }
}
