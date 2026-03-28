import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSignal = signal<Toast[]>([]);
  public readonly toasts = this.toastsSignal.asReadonly();

  show(message: string, type: Toast['type'] = 'info', durationMs: number = 3000) {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, message, type };

    this.toastsSignal.update(toasts => [...toasts, newToast]);

    setTimeout(() => {
      this.remove(id);
    }, durationMs);
  }

  remove(id: string) {
    this.toastsSignal.update(toasts => toasts.filter(t => t.id !== id));
  }
}

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" style="position: fixed; top: 1rem; right: 1rem; z-index: 1050; display: flex; flex-direction: column; gap: 0.5rem;">
      <div *ngFor="let toast of toastService.toasts()"
           class="toast"
           [ngClass]="'toast-' + toast.type"
           style="padding: 1rem; border-radius: 4px; box-shadow: 0 0.25rem 0.75rem rgba(0,0,0,.1); min-width: 250px; display: flex; justify-content: space-between; align-items: center; background: white;">
        <span>{{ toast.message }}</span>
        <button (click)="toastService.remove(toast.id)" style="background: none; border: none; cursor: pointer; font-size: 1.2rem; line-height: 1;">&times;</button>
      </div>
    </div>
  `,
  styles: [`
    .toast-success { border-left: 4px solid green; }
    .toast-error { border-left: 4px solid red; }
    .toast-warning { border-left: 4px solid orange; }
    .toast-info { border-left: 4px solid blue; }
  `]
})
export class ToastContainerComponent {
  public toastService = inject(ToastService);
}
