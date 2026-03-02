import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UsersService, User } from '../../services/users.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
    selector: 'app-user-list',
    imports: [CommonModule],
    templateUrl: './user-list.component.html',
    styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  loading = false;
  currentUsername: string = '';

  constructor(
    private usersService: UsersService,
    private authService: AuthService,
    private router: Router,
    private toast: ToastService
  ) {
    this.currentUsername = this.authService.getUsername() || '';
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.usersService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.toast.error('Failed to load users');
        console.error('Error loading users:', error);
      }
    });
  }

  editUser(user: User): void {
    this.router.navigate(['/manage-users', user._id]);
  }

  deleteUser(user: User): void {
    // Prevent deleting your own account
    if (user.username === this.currentUsername) {
      this.toast.warning('You cannot delete your own account');
      return;
    }

    const confirmed = confirm(`Are you sure you want to delete user "${user.username}"?`);
    if (!confirmed) {
      return;
    }

    this.usersService.deleteUser(user._id || user.id).subscribe({
      next: () => {
        this.toast.success(`User "${user.username}" deleted successfully`);
        this.loadUsers(); // Reload the list
      },
      error: (error) => {
        const message = error.error?.error || 'Failed to delete user';
        this.toast.error(message);
        console.error('Error deleting user:', error);
      }
    });
  }

  createUser(): void {
    this.router.navigate(['/manage-users/new']);
  }

  isCurrentUser(user: User): boolean {
    return user.username === this.currentUsername;
  }
}
