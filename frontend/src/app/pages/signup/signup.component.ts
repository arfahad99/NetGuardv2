import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-signup',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {
  username = '';
  email = '';
  password = '';
  loading = false;
  showPassword = false;

  usernameError = '';
  emailError = '';
  passwordError = '';
  serverError = '';

  awaitingVerification = false;
  verificationCode = '';
  verificationError = '';

  constructor(private authService: AuthService, private router: Router, private toast: ToastService) { }

  validateUsername() {
    // Clear server error when user starts typing
    if (this.usernameError && this.usernameError.includes('already exists')) {
      this.usernameError = '';
    }

    if (!this.username) {
      this.usernameError = 'Username is required';
    } else if (this.username.length < 3) {
      this.usernameError = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(this.username)) {
      this.usernameError = 'Username can only contain letters, numbers, and underscores';
    } else {
      // Only clear client-side validation errors, keep server errors
      if (!this.usernameError.includes('already exists')) {
        this.usernameError = '';
      }
    }
  }

  validateEmail() {
    // Clear server error when user starts typing
    if (this.emailError && this.emailError.includes('already')) {
      this.emailError = '';
    }

    if (!this.email) {
      this.emailError = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      this.emailError = 'Please enter a valid email address';
    } else {
      // Only clear client-side validation errors, keep server errors
      if (!this.emailError.includes('already')) {
        this.emailError = '';
      }
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

  getPasswordStrength(): string {
    const length = this.password.length;
    const hasUpper = /[A-Z]/.test(this.password);
    const hasLower = /[a-z]/.test(this.password);
    const hasNumber = /[0-9]/.test(this.password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(this.password);

    const score = (length >= 8 ? 1 : 0) + (hasUpper ? 1 : 0) + (hasLower ? 1 : 0) + (hasNumber ? 1 : 0) + (hasSpecial ? 1 : 0);

    if (score <= 2) return 'Weak';
    if (score === 3) return 'Medium';
    return 'Strong';
  }

  getPasswordStrengthPercent(): number {
    const strength = this.getPasswordStrength();
    if (strength === 'Weak') return 33;
    if (strength === 'Medium') return 66;
    return 100;
  }

  getPasswordStrengthClass(): string {
    const strength = this.getPasswordStrength();
    if (strength === 'Weak') return 'bg-danger';
    if (strength === 'Medium') return 'bg-warning';
    return 'bg-success';
  }

  isFormValid(): boolean {
    // Check if all fields are filled and no client-side validation errors
    const hasRequiredFields = !!(this.username && this.email && this.password);
    const hasNoClientErrors = !this.hasClientValidationErrors();

    return hasRequiredFields && hasNoClientErrors;
  }

  private hasClientValidationErrors(): boolean {
    // Only check for client-side validation errors, not server-side "already exists" errors
    const usernameClientError = this.usernameError && !this.usernameError.includes('already exists');
    const emailClientError = this.emailError && !this.emailError.includes('already');
    const passwordClientError = !!this.passwordError;

    return !!(usernameClientError || emailClientError || passwordClientError);
  }

  hasServerErrors(): boolean {
    const usernameServerError = this.usernameError && this.usernameError.includes('already exists');
    const emailServerError = this.emailError && this.emailError.includes('already');

    return !!(usernameServerError || emailServerError);
  }

  onUsernameInput() {
    // Clear server error immediately when user starts typing
    if (this.usernameError && this.usernameError.includes('already exists')) {
      this.usernameError = '';
    }
    this.validateUsername();
  }

  onEmailInput() {
    // Clear server error immediately when user starts typing
    if (this.emailError && this.emailError.includes('already')) {
      this.emailError = '';
    }
    this.validateEmail();
  }

  onSignup() {
    // Clear previous server errors
    this.serverError = '';
    this.clearServerFieldErrors();

    this.validateUsername();
    this.validateEmail();
    this.validatePassword();

    if (!this.isFormValid()) {
      this.toast.warning('Please fix all validation errors');
      return;
    }

    this.loading = true;
    this.authService.signup(this.username, this.email, this.password).subscribe({
      next: (res: any) => {
        if (res.requires_verification) {
          this.toast.info('Please check your email for a verification code.');
          this.awaitingVerification = true;
          this.loading = false;
        } else {
          this.toast.success('Account created successfully! Please sign in.');
          this.router.navigate(['/signin']);
        }
      },
      error: (err) => {
        this.loading = false;
        this.handleSignupError(err);
      }
    });
  }

  onVerify() {
    if (!this.verificationCode) return;
    this.loading = true;
    this.verificationError = '';

    this.authService.verifyEmail(this.username, this.verificationCode).subscribe({
      next: () => {
        this.toast.success('Email verified successfully! You can now sign in.');
        this.router.navigate(['/signin']);
      },
      error: (err) => {
        this.loading = false;
        this.verificationError = err.error?.error || 'Verification failed. Please check the code and try again.';
        this.toast.error(this.verificationError);
      }
    });
  }

  resendVerificationCode() {
    this.authService.resendCode(this.username).subscribe({
      next: () => this.toast.success('Verification code resent to your email!'),
      error: (err) => this.toast.error(err.error?.error || 'Failed to resend verification code.')
    });
  }

  private clearServerFieldErrors() {
    // Only clear server-side errors, keep client-side validation errors
    if (this.usernameError && this.usernameError.includes('already exists')) {
      this.usernameError = '';
    }
    if (this.emailError && this.emailError.includes('already exists')) {
      this.emailError = '';
    }
  }

  private handleSignupError(err: any) {
    const errorResponse = err.error;
    const errorMessage = errorResponse?.error || 'Signup failed. Please try again.';
    const conflicts = errorResponse?.conflicts || [];

    // Handle specific field conflicts
    if (conflicts.includes('username')) {
      this.usernameError = 'This username already exists. Please choose a different one.';
    }

    if (conflicts.includes('email')) {
      this.emailError = 'This email is already registered. Please use a different email.';
    }

    // Set general server error for toast
    this.serverError = errorMessage;
    this.toast.error(errorMessage);
  }
}
