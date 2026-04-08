import { Component, inject, OnInit, signal, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { User } from '../../../core/dtos/user.dto';
import { UserStatus } from '../../../core/enums/user-status.enum';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent],
  templateUrl: './users.component.html',
})
export class UsersComponent implements OnInit, OnDestroy {
  private readonly adminService = inject(AdminService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  users = signal<User[]>([]);
  total = signal(0);
  page = signal(1);
  limit = signal(10);
  totalPages = signal(0);

  searchQuery = signal('');
  selectedStatus = signal<UserStatus | ''>('');

  loading = signal(false);
  openMenuId = signal<string | null>(null);
  pendingUserId: string | null = null;
  usersError = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  private searchSubject = new Subject<string>();
  private searchSubscription!: Subscription;

  readonly Object = Object;
  readonly Math = Math;
  readonly UserStatus = UserStatus;

  statusOptions = Object.values(UserStatus);

  ngOnInit(): void {
    this.loadUsers();

    this.searchSubscription = this.searchSubject
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((query) => {
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
    this.usersError.set(null);

    this.adminService
      .getUsers({
        page: this.page(),
        limit: this.limit(),
        search: this.searchQuery() || undefined,
        status: (this.selectedStatus() as UserStatus) || undefined,
      })
      .subscribe({
        next: (response) => {
          this.users.set(response.data.items);
          this.total.set(response.data.total);
          this.page.set(response.data.page);
          this.limit.set(response.data.limit);
          this.totalPages.set(response.data.totalPages);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.usersError.set('Failed to load users. Please try again.');
        },
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
      'bg-red-500',
      'bg-orange-500',
      'bg-amber-500',
      'bg-green-500',
      'bg-emerald-500',
      'bg-teal-500',
      'bg-cyan-500',
      'bg-blue-500',
      'bg-indigo-500',
      'bg-violet-500',
      'bg-purple-500',
      'bg-fuchsia-500',
      'bg-pink-500',
      'bg-rose-500',
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
    return role
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
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

  async approveUser(user: User): Promise<void> {
    const isConfirmed = await this.confirmDialog.open({
      title: 'Approve User',
      message: 'Are you sure you want to approve this user? They will gain access to the platform.',
      details: [
        { label: 'Name', value: `${user.firstName} ${user.lastName}` },
        { label: 'Email', value: user.email },
      ],
      confirmText: 'Approve',
      cancelText: 'Cancel',
      confirmColor: 'success',
    });

    if (isConfirmed) {
      this.pendingUserId = user._id;
      this.errorMessage.set(null);
      this.adminService.approveUser(user._id).subscribe({
        next: () => {
          this.loadUsers(); // Reload to get updated status
          this.pendingUserId = null;
        },
        error: (err) => {
          this.errorMessage.set('Error approving user. Please try again.');
          this.pendingUserId = null;
        },
      });
    }
  }

  async rejectUser(user: User): Promise<void> {
    const isConfirmed = await this.confirmDialog.open({
      title: 'Reject User',
      message: 'Are you sure you want to reject this user? They will be denied access.',
      details: [
        { label: 'Name', value: `${user.firstName} ${user.lastName}` },
        { label: 'Email', value: user.email },
      ],
      confirmText: 'Reject',
      cancelText: 'Cancel',
      confirmColor: 'danger',
    });

    if (isConfirmed) {
      this.pendingUserId = user._id;
      this.errorMessage.set(null);
      this.adminService.rejectUser(user._id).subscribe({
        next: () => {
          this.loadUsers(); // Reload to get updated status
          this.pendingUserId = null;
        },
        error: (err) => {
          this.errorMessage.set('Error rejecting user. Please try again.');
          this.pendingUserId = null;
        },
      });
    }
  }

  editUser(user: User): void {
    console.log('Edit user', user);
  }

  setUserStatus(user: User, status: UserStatus): void {
    console.log('Set user status', user, status);
  }

  deleteUser(user: User): void {
    console.log('Delete user', user);
  }
}
