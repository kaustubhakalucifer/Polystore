import { Injectable, signal, effect, computed } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private themeSignal = signal<'light' | 'dark'>('light');

  // Expose computed signal
  public readonly isDark = computed(() => this.themeSignal() === 'dark');

  constructor() {
    this.initializeTheme();
    // Use an effect to automatically sync DOM changes when the theme signal changes
    effect(() => {
      const currentTheme = this.themeSignal();
      this.updateDom(currentTheme);
    });
  }

  private initializeTheme(): void {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      this.themeSignal.set(savedTheme);
    } else {
      // Fallback to system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.themeSignal.set(prefersDark ? 'dark' : 'light');
    }
  }

  public toggleTheme(): void {
    const newTheme = this.themeSignal() === 'dark' ? 'light' : 'dark';
    this.themeSignal.set(newTheme);
    localStorage.setItem('theme', newTheme);
  }

  private updateDom(theme: 'light' | 'dark'): void {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}
