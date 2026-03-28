import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  template: `
    <div
      class="bg-white dark:bg-zinc-900 rounded-lg shadow-sm p-6 border border-slate-200 dark:border-zinc-800 transition-colors duration-200"
    >
      <h1 class="text-2xl font-bold text-slate-800 dark:text-white mb-4">Admin Dashboard</h1>
      <p class="text-slate-600 dark:text-zinc-400">Welcome to the Polystore administration area.</p>
    </div>
  `,
})
export class AdminDashboardComponent {}
