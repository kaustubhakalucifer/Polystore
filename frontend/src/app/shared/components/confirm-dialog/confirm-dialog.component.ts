import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (dialogService.state(); as dialogState) {
      <!-- Backdrop -->
      <div
        class="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity"
        (click)="onBackdropClick()"
        (keyup.escape)="onBackdropClick()"
        tabindex="0"
        aria-modal="true"
        role="dialog"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-message"
      >
        <!-- Dialog Container -->
        <div
          class="bg-white dark:bg-zinc-800 rounded-lg shadow-xl w-full max-w-md transform transition-all p-6 ring-1 ring-slate-900/5 dark:ring-white/10"
          (click)="$event.stopPropagation()"
          (keyup.enter)="$event.stopPropagation()"
          tabindex="0"
        >
          <!-- Header -->
          <div class="mb-5 flex flex-col items-center justify-center gap-3 text-center">
            @if (dialogState.options.confirmColor === 'danger') {
              <div
                class="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400"
              >
                <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            } @else if (dialogState.options.confirmColor === 'success') {
              <div
                class="flex-shrink-0 w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400"
              >
                <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            } @else {
              <div
                class="flex-shrink-0 w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400"
              >
                <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            }
            <div class="mt-2">
              <h3
                id="dialog-title"
                class="text-xl font-bold text-slate-900 dark:text-white tracking-tight"
              >
                {{ dialogState.options.title }}
              </h3>
            </div>
          </div>

          <!-- Body -->
          <div class="mb-6 text-center">
            <p
              id="dialog-message"
              class="text-base text-slate-600 dark:text-slate-300 leading-relaxed"
            >
              {{ dialogState.options.message }}
            </p>
            @if (dialogState.options.details && dialogState.options.details.length > 0) {
              <div
                class="mt-5 bg-slate-50 dark:bg-zinc-800/80 rounded-lg p-4 border border-slate-200 dark:border-zinc-700/80 text-left"
              >
                <dl class="space-y-3">
                  @for (detail of dialogState.options.details; track detail.label) {
                    <div class="flex flex-col sm:flex-row sm:items-center">
                      <dt
                        class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 sm:w-1/3"
                      >
                        {{ detail.label }}
                      </dt>
                      <dd
                        class="mt-1 sm:mt-0 text-sm font-medium text-slate-900 dark:text-zinc-100 sm:w-2/3"
                      >
                        {{ detail.value }}
                      </dd>
                    </div>
                  }
                </dl>
              </div>
            }
          </div>

          <!-- Footer Actions -->
          <div class="flex flex-col sm:flex-row justify-center sm:justify-end gap-3 pt-2">
            <button
              type="button"
              (click)="dialogService.close(false)"
              class="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-zinc-700 dark:text-zinc-200 dark:border-zinc-600 dark:hover:bg-zinc-600 dark:focus:ring-offset-zinc-800 transition-colors"
            >
              {{ dialogState.options.cancelText || 'Cancel' }}
            </button>
            <button
              type="button"
              (click)="dialogService.close(true)"
              [ngClass]="{
                'bg-red-600 hover:bg-red-700 focus:ring-red-500':
                  dialogState.options.confirmColor === 'danger',
                'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500':
                  dialogState.options.confirmColor === 'success',
                'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500':
                  !dialogState.options.confirmColor ||
                  dialogState.options.confirmColor === 'primary',
              }"
              class="px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-zinc-800 transition-colors"
            >
              {{ dialogState.options.confirmText || 'Confirm' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialogComponent {
  public dialogService = inject(ConfirmDialogService);

  onBackdropClick() {
    // We allow dismissing the dialog by clicking the backdrop.
    this.dialogService.close(false);
  }
}
