import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toastsSignal = signal<Toast[]>([]);
  public readonly toasts = this.toastsSignal.asReadonly();

  show(message: string, type: Toast['type'] = 'info', durationMs = 3000) {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, message, type };

    this.toastsSignal.update((toasts) => [...toasts, newToast]);

    setTimeout(() => {
      this.remove(id);
    }, durationMs);
  }

  remove(id: string) {
    this.toastsSignal.update((toasts) => toasts.filter((t) => t.id !== id));
  }
}

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-[1050] flex flex-col gap-2">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="flex justify-between items-center p-4 rounded-md shadow-lg min-w-[250px] bg-white dark:bg-zinc-800 text-slate-900 dark:text-white border-l-4"
          [attr.aria-live]="
            toast.type === 'error' || toast.type === 'warning' ? 'assertive' : 'polite'
          "
          [attr.role]="toast.type === 'error' || toast.type === 'warning' ? 'alert' : 'status'"
          aria-atomic="true"
          [ngClass]="{
            'border-green-500': toast.type === 'success',
            'border-red-500': toast.type === 'error',
            'border-orange-500': toast.type === 'warning',
            'border-blue-500': toast.type === 'info',
          }"
        >
          <span>{{ toast.message }}</span>
          <button
            (click)="toastService.remove(toast.id)"
            class="bg-transparent border-none cursor-pointer text-xl leading-none text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-300"
          >
            &times;
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastContainerComponent {
  public toastService = inject(ToastService);
}
