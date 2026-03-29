import { Component, inject, OnInit, signal, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { User } from '../../../core/dtos/user.dto';
import { UserStatus } from '../../../core/enums/user-status.enum';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
})
export class UsersComponent implements OnInit, OnDestroy {
  private readonly adminService = inject(AdminService);

  users = signal<User[]>([]);
  total = signal(0);
  page = signal(1);
  limit = signal(10);
  totalPages = signal(0);

  searchQuery = signal('');
  selectedStatus = signal<UserStatus | ''>('');

  loading = signal(false);
  openMenuId = signal<string | null>(null);

  private searchSubject = new Subject<string>();
  private searchSubscription!: Subscription;

  readonly Object = Object;
  readonly Math = Math;
  readonly UserStatus = UserStatus;

  statusOptions = Object.values(UserStatus);

  ngOnInit(): void {
    this.loadUsers();

    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe((query) => {
      this.searchQuery.set(query);
      this.page.set(1);
      this.loadUsers();
    });
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  onSearchChange(query: string): void {
    this.searchSubject.next(query);
  }

  loadUsers(): void {
    this.loading.set(true);

    this.adminService.getUsers({
      page: this.page(),
      limit: this.limit(),
      search: this.searchQuery() || undefined,
      status: (this.selectedStatus() as UserStatus) || undefined,
    }).subscribe({
      next: (response) => {
        this.users.set(response.data.items);
        this.total.set(response.data.total);
        this.page.set(response.data.page);
        this.limit.set(response.data.limit);
        this.totalPages.set(response.data.totalPages);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  onSearch(): void {
    this.page.set(1);
    this.loadUsers();
  }

  onStatusChange(): void {
    this.page.set(1);
    this.loadUsers();
  }

  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalPages()) {
      this.page.set(p);
      this.loadUsers();
    }
  }

  getAvatarColor(firstName: string): string {
    const colors = [
      'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-green-500',
      'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-blue-500',
      'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500',
      'bg-pink-500', 'bg-rose-500'
    ];
    if (!firstName) return colors[0];

    let hash = 0;
    for (let i = 0; i < firstName.length; i++) {
      hash = firstName.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }

  formatRole(role: string): string {
    if (!role) return '';
    return role.split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  toggleMenu(userId: string, event: Event): void {
    event.stopPropagation();
    if (this.openMenuId() === userId) {
      this.openMenuId.set(null);
    } else {
      this.openMenuId.set(userId);
    }
  }

  @HostListener('document:click')
  closeMenu(): void {
    this.openMenuId.set(null);
  }

  approveUser(userId: string): void {
    if (confirm('Are you sure you want to approve this user?')) {
      this.adminService.approveUser(userId).subscribe({
        next: () => {
          this.loadUsers(); // Reload to get updated status
        },
        error: (err) => console.error('Error approving user:', err)
      });
    }
  }

  rejectUser(userId: string): void {
    if (confirm('Are you sure you want to reject this user?')) {
      this.adminService.rejectUser(userId).subscribe({
        next: () => {
          this.loadUsers(); // Reload to get updated status
        },
        error: (err) => console.error('Error rejecting user:', err)
      });
    }
  }
}
