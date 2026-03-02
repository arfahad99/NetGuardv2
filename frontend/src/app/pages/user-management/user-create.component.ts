import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UsersService } from '../../services/users.service';
import { ToastService } from '../../services/toast.service';

@Component({
    selector: 'app-user-create',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './user-create.component.html',
    styleUrls: ['./user-create.component.css']
})
export class UserCreateComponent {
  form: FormGroup;
  submitting = false;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private usersService: UsersService,
    private toast: ToastService
  ) {
    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      admin: [false]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warning('Please fill in all required fields correctly');
      return;
    }

    this.submitting = true;
    const payload = this.form.value;

    this.usersService.createUser(payload).subscribe({
      next: () => {
        this.submitting = false;
        this.toast.success('User created successfully');
        this.router.navigate(['/manage-users']);
      },
      error: (error) => {
        this.submitting = false;
        const message = error.error?.error || 'Failed to create user';
        this.toast.error(message);
        console.error('Error creating user:', error);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/manage-users']);
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  get username() {
    return this.form.get('username');
  }

  get email() {
    return this.form.get('email');
  }

  get password() {
    return this.form.get('password');
  }
}
