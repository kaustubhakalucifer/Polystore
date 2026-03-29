import { Injectable, signal } from '@angular/core';

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  details?: { label: string; value: string }[];
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'danger' | 'success';
}

interface DialogState {
  options: ConfirmDialogOptions;
  resolve: (value: boolean) => void;
}

@Injectable({
  providedIn: 'root',
})
export class ConfirmDialogService {
  private stateSignal = signal<DialogState | null>(null);
  public readonly state = this.stateSignal.asReadonly();

  /**
   * Opens a confirmation dialog and returns a Promise that resolves to a boolean.
   * True if the user confirmed, false if cancelled or dismissed.
   */
  open(options: ConfirmDialogOptions): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.stateSignal.set({ options, resolve });
    });
  }

  /**
   * Closes the active dialog with the given result.
   */
  close(result: boolean): void {
    const currentState = this.stateSignal();
    if (currentState) {
      currentState.resolve(result);
      this.stateSignal.set(null);
    }
  }
}
