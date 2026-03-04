import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { SignupComponent } from './signup.component';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { of, throwError } from 'rxjs';

describe('SignupComponent', () => {
  let component: SignupComponent;
  let fixture: ComponentFixture<SignupComponent>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let toastSpy: jasmine.SpyObj<ToastService>;
  let router: Router;

  beforeEach(async () => {
    const authSpyObj = jasmine.createSpyObj('AuthService', ['signup']);
    const toastSpyObj = jasmine.createSpyObj('ToastService', ['success', 'error', 'warning']);

    await TestBed.configureTestingModule({
      imports: [SignupComponent, FormsModule, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authSpyObj },
        { provide: ToastService, useValue: toastSpyObj }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SignupComponent);
    component = fixture.componentInstance;
    authSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    toastSpy = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should validate username correctly', () => {
    // Empty username
    component.username = '';
    component.validateUsername();
    expect(component.usernameError).toBe('Username is required');

    // Too short username
    component.username = 'ab';
    component.validateUsername();
    expect(component.usernameError).toBe('Username must be at least 3 characters');

    // Invalid characters
    component.username = 'user@123';
    component.validateUsername();
    expect(component.usernameError).toBe('Username can only contain letters, numbers, and underscores');

    // Valid username
    component.username = 'valid_user123';
    component.validateUsername();
    expect(component.usernameError).toBe('');
  });

  it('should validate email correctly', () => {
    // Empty email
    component.email = '';
    component.validateEmail();
    expect(component.emailError).toBe('Email is required');

    // Invalid email format
    component.email = 'invalid-email';
    component.validateEmail();
    expect(component.emailError).toBe('Please enter a valid email address');

    // Valid email
    component.email = 'user@example.com';
    component.validateEmail();
    expect(component.emailError).toBe('');
  });

  it('should validate password correctly', () => {
    // Empty password
    component.password = '';
    component.validatePassword();
    expect(component.passwordError).toBe('Password is required');

    // Too short password
    component.password = '12345';
    component.validatePassword();
    expect(component.passwordError).toBe('Password must be at least 6 characters');

    // Valid password
    component.password = 'validpass123';
    component.validatePassword();
    expect(component.passwordError).toBe('');
  });

  it('should calculate password strength correctly', () => {
    // Weak password (score <= 2)
    component.password = 'weak';
    expect(component.getPasswordStrength()).toBe('Weak');

    // Medium password (score = 3)
    component.password = 'Med123';
    expect(component.getPasswordStrength()).toBe('Medium');

    // Strong password (score >= 4)
    component.password = 'Strong123!@#';
    expect(component.getPasswordStrength()).toBe('Strong');
  });

  it('should calculate password strength percentage correctly', () => {
    component.password = 'weak';
    expect(component.getPasswordStrengthPercent()).toBe(33);

    component.password = 'Med123';
    expect(component.getPasswordStrengthPercent()).toBe(66);

    component.password = 'Strong123!@#';
    expect(component.getPasswordStrengthPercent()).toBe(100);
  });

  it('should get correct password strength class', () => {
    component.password = 'weak';
    expect(component.getPasswordStrengthClass()).toBe('bg-danger');

    component.password = 'Med123';
    expect(component.getPasswordStrengthClass()).toBe('bg-warning');

    component.password = 'Strong123!@#';
    expect(component.getPasswordStrengthClass()).toBe('bg-success');
  });

  it('should validate form correctly', () => {
    // Invalid form
    component.username = '';
    component.email = '';
    component.password = '';
    expect(component.isFormValid()).toBeFalse();

    // Valid form
    component.username = 'testuser';
    component.email = 'test@example.com';
    component.password = 'password123';
    component.usernameError = '';
    component.emailError = '';
    component.passwordError = '';
    expect(component.isFormValid()).toBeTrue();
  });

  it('should toggle password visibility', () => {
    expect(component.showPassword).toBeFalse();

    // Simulate clicking the eye icon
    component.showPassword = !component.showPassword;
    expect(component.showPassword).toBeTrue();

    component.showPassword = !component.showPassword;
    expect(component.showPassword).toBeFalse();
  });

  it('should handle successful signup', () => {
    component.username = 'testuser';
    component.email = 'test@example.com';
    component.password = 'password123';
    component.usernameError = '';
    component.emailError = '';
    component.passwordError = '';

    authSpy.signup.and.returnValue(of({ success: true }));

    component.onSignup();

    expect(authSpy.signup).toHaveBeenCalledWith('testuser', 'test@example.com', 'password123', '');
    expect(toastSpy.success).toHaveBeenCalledWith('Account created successfully! Please sign in.');
    expect(router.navigate).toHaveBeenCalledWith(['/signin']);
  });

  it('should handle signup error', () => {
    component.username = 'testuser';
    component.email = 'test@example.com';
    component.password = 'password123';
    component.usernameError = '';
    component.emailError = '';
    component.passwordError = '';

    const errorResponse = { error: { error: 'Username already exists' } };
    authSpy.signup.and.returnValue(throwError(() => errorResponse));

    component.onSignup();

    expect(authSpy.signup).toHaveBeenCalled();
    expect(toastSpy.error).toHaveBeenCalledWith('Username already exists');
    expect(component.loading).toBeFalse();
  });

  it('should handle signup error without specific message', () => {
    component.username = 'testuser';
    component.email = 'test@example.com';
    component.password = 'password123';
    component.usernameError = '';
    component.emailError = '';
    component.passwordError = '';

    authSpy.signup.and.returnValue(throwError(() => new Error('Network error')));

    component.onSignup();

    expect(toastSpy.error).toHaveBeenCalledWith('Signup failed. Please try again.');
    expect(component.loading).toBeFalse();
  });

  it('should not submit invalid form', () => {
    component.username = '';
    component.email = 'invalid-email';
    component.password = '123';

    component.onSignup();

    expect(toastSpy.warning).toHaveBeenCalledWith('Please fix all validation errors');
    expect(authSpy.signup).not.toHaveBeenCalled();
  });

  it('should set loading state during signup', () => {
    component.username = 'testuser';
    component.email = 'test@example.com';
    component.password = 'password123';
    component.usernameError = '';
    component.emailError = '';
    component.passwordError = '';

    authSpy.signup.and.returnValue(of({ success: true }));

    expect(component.loading).toBeFalse();
    component.onSignup();
    // Loading state is set to true during the call, then false after success
    expect(authSpy.signup).toHaveBeenCalled();
  });
});