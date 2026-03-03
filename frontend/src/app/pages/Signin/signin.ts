import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { TextFlipComponent } from '../../components/text-flip/text-flip.component';
import { StatefulButtonComponent } from '../../components/stateful-button/stateful-button.component';
import { MovingBorderDirective } from '../../components/directives/moving-border.directive';

/**
 * Sign In Component
 * 
 * Handles user authentication with features:
 * - Username/password validation
 * - Remember me functionality
 * - Guest login option
 * - Error handling with toast notifications
 * - Stateful button with loading states
 */
@Component({
  selector: 'app-signin',
  imports: [CommonModule, FormsModule, RouterLink, TextFlipComponent, StatefulButtonComponent, MovingBorderDirective],
  templateUrl: './signin.html',
  styleUrls: ['./signin.css']
})
export class SigninComponent {
  // Form fields
  username = '';
  password = '';

  // UI state
  loading = false;
  showPassword = false;
  rememberMe = false;
  touched = false;

  // Validation
  usernameError = '';
  passwordError = '';
  loginAttempts = 0;

  // Auth token (for potential logout functionality)
  token: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toast: ToastService
  ) {
    // Restore remembered username if exists
    const savedUsername = localStorage.getItem('rememberedUsername');
    if (savedUsername) {
      this.username = savedUsername;
      this.rememberMe = true;
    }
  }

  validateUsername() {
    if (!this.username) {
      this.usernameError = 'Username or Email is required';
    } else if (this.username.length < 3) {
      this.usernameError = 'Username or Email must be at least 3 characters';
    } else {
      this.usernameError = '';
    }
  }

  validatePassword() {
    if (!this.password) {
      this.passwordError = 'Password is required';
    } else if (this.password.length < 6) {
      this.passwordError = 'Password must be at least 6 characters';
    } else {
      this.passwordError = '';
    }
  }

  isFormValid(): boolean {
    return !!(this.username && this.password && !this.usernameError && !this.passwordError);
  }

  /**
   * Handles user login with validation and error handling
   */
  async onSignin() {
    // Validate form fields
    this.validateUsername();
    this.validatePassword();
    this.touched = true;

    // Check if form is valid
    if (!this.isFormValid()) {
      this.toast.warning('Please enter valid credentials');
      throw new Error('Form validation failed');
    }

    this.loading = true;

    return new Promise<void>((resolve, reject) => {
      this.authService.signin(this.username, this.password).subscribe({
        next: (res) => {
          // Store token if returned
          if (res.token) {
            this.token = res.token;
          }

          // Handle remember me
          if (this.rememberMe) {
            localStorage.setItem('rememberedUsername', this.username);
          } else {
            localStorage.removeItem('rememberedUsername');
          }

          // Set login state
          this.authService.setLoginState(this.username);

          // Get user info for welcome message
          const username = this.authService.getUsername();
          const role = this.authService.getRole();
          const roleDisplay = this.getRoleDisplay(role);

          // Show success message
          this.toast.success(`Welcome back, ${username}! 👋\nRole: ${roleDisplay}`);

          // Reset login attempts
          this.loginAttempts = 0;
          this.loading = false;

          // Navigate to home page
          this.router.navigate(['/home']);

          resolve();
        },
        error: (err) => {
          this.loading = false;
          this.loginAttempts++;

          // Extract error message
          const errorMessage = err.error?.Message || err.error?.message || 'Sign in failed';

          // Handle specific error types
          if (errorMessage.toLowerCase().includes('username')) {
            this.usernameError = 'Invalid username';
            this.toast.error('Username not found');
          } else if (errorMessage.toLowerCase().includes('password')) {
            this.passwordError = 'Incorrect password';
            this.toast.error('Incorrect password');
          } else {
            this.toast.error(errorMessage);
          }

          // Clear password for security
          this.password = '';
          reject(err);
        }
      });
    });
  }

  /**
   * Handles guest login (read-only access)
   */
  onGuestSignin() {
    this.loading = true;
    this.authService.guestLogin().subscribe({
      next: () => {
        const username = this.authService.getUsername();
        this.toast.success(`Welcome, ${username}! 👋\nRole: Guest (Read-only access)`);
        this.router.navigate(['/home']);
      },
      error: () => {
        this.loading = false;
        this.toast.error('Guest sign in failed. Please try again.');
      }
    });
  }

  /**
   * Logs out the current user (if token exists)
   */
  onLogout() {
    if (!this.token) return;

    this.authService.signout().subscribe({
      next: () => {
        this.authService.clearLoginState();
        this.token = null;
        this.toast.success('Logged out successfully');
        this.router.navigate(['/signin']);
      },
      error: () => {
        this.toast.error('Logout failed');
      }
    });
  }

  /**
   * Converts role code to display name
   */
  getRoleDisplay(role: string): string {
    const roleMap: Record<string, string> = {
      'admin': 'Administrator',
      'user': 'Standard User',
      'guest': 'Guest'
    };
    return roleMap[role] || 'User';
  }
}
