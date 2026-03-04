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
  phoneError = '';
  passwordError = '';
  serverError = '';

  verificationMethod: 'email' | 'phone' = 'email';
  phone = '';
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
    if (this.emailError && this.emailError.includes('already')) {
      this.emailError = '';
    }
    if (!this.email) {
      this.emailError = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      this.emailError = 'Please enter a valid email address';
    } else {
      if (!this.emailError.includes('already')) {
        this.emailError = '';
      }
    }
  }

  validatePhone() {
    if (this.phoneError && this.phoneError.includes('already')) {
      this.phoneError = '';
    }
    if (!this.phone) {
      this.phoneError = 'Phone number is required';
    } else if (!/^\+[1-9]\d{1,14}$/.test(this.phone)) {
      this.phoneError = 'Please enter a valid phone number with country code (e.g. +1234567890)';
    } else {
      if (!this.phoneError.includes('already')) {
        this.phoneError = '';
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
    const hasRequiredFields = !!(this.username && this.password && (this.verificationMethod === 'email' ? this.email : this.phone));
    const hasNoClientErrors = !this.hasClientValidationErrors();

    return hasRequiredFields && hasNoClientErrors;
  }

  private hasClientValidationErrors(): boolean {
    const usernameClientError = this.usernameError && !this.usernameError.includes('already exists');
    const authMethodClientError = this.verificationMethod === 'email'
      ? this.emailError && !this.emailError.includes('already')
      : this.phoneError && !this.phoneError.includes('already');
    const passwordClientError = !!this.passwordError;

    return !!(usernameClientError || authMethodClientError || passwordClientError);
  }

  hasServerErrors(): boolean {
    const usernameServerError = this.usernameError && this.usernameError.includes('already exists');
    const emailServerError = this.emailError && this.emailError.includes('already');
    const phoneServerError = this.phoneError && this.phoneError.includes('already');

    return !!(usernameServerError || emailServerError || phoneServerError);
  }

  onUsernameInput() {
    if (this.usernameError && this.usernameError.includes('already exists')) {
      this.usernameError = '';
    }
    this.validateUsername();
  }

  onEmailInput() {
    if (this.emailError && this.emailError.includes('already')) {
      this.emailError = '';
    }
    this.validateEmail();
  }

  onPhoneInput() {
    if (this.phoneError && this.phoneError.includes('already')) {
      this.phoneError = '';
    }
    this.validatePhone();
  }

  onMethodChange() {
    this.emailError = '';
    this.phoneError = '';
    if (this.verificationMethod === 'email') {
      this.phone = '';
    } else {
      this.email = '';
    }
  }

  onSignup() {
    this.serverError = '';
    this.clearServerFieldErrors();

    this.validateUsername();
    if (this.verificationMethod === 'email') this.validateEmail();
    else this.validatePhone();

    this.validatePassword();

    if (!this.isFormValid()) {
      this.toast.warning('Please fix all validation errors');
      return;
    }

    this.loading = true;
    this.authService.signup(this.username, this.email, this.password, this.phone).subscribe({
      next: (res: any) => {
        if (res.requires_verification) {
          const destination = this.verificationMethod === 'email' ? 'email' : 'phone';
          this.toast.info(`Please check your ${destination} for a verification code.`);
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
    if (this.usernameError && this.usernameError.includes('already exists')) {
      this.usernameError = '';
    }
    if (this.emailError && this.emailError.includes('already')) {
      this.emailError = '';
    }
    if (this.phoneError && this.phoneError.includes('already')) {
      this.phoneError = '';
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

    if (conflicts.includes('phone')) {
      this.phoneError = 'This phone number is already registered.';
    }

    // Set general server error for toast
    this.serverError = errorMessage;
    this.toast.error(errorMessage);
  }
}
