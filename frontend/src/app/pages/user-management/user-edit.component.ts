import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UsersService, User } from '../../services/users.service';
import { ToastService } from '../../services/toast.service';

@Component({
    selector: 'app-user-edit',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './user-edit.component.html',
    styleUrls: ['./user-edit.component.css']
})
export class UserEditComponent implements OnInit {
  form: FormGroup;
  userId: string = '';
  loading = false;
  submitting = false;
  user: User | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private usersService: UsersService,
    private toast: ToastService
  ) {
    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      admin: [false]
    });
  }

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id') || '';
    if (this.userId) {
      this.loadUser();
    }
  }

  loadUser(): void {
    this.loading = true;
    this.usersService.getUser(this.userId).subscribe({
      next: (user) => {
        this.user = user;
        this.form.patchValue({
          username: user.username,
          email: user.email,
          admin: user.admin
        });
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.toast.error('Failed to load user');
        console.error('Error loading user:', error);
        this.cancel();
      }
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

    this.usersService.updateUser(this.userId, payload).subscribe({
      next: () => {
        this.submitting = false;
        this.toast.success('User updated successfully');
        this.router.navigate(['/manage-users']);
      },
      error: (error) => {
        this.submitting = false;
        const message = error.error?.error || 'Failed to update user';
        this.toast.error(message);
        console.error('Error updating user:', error);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/manage-users']);
  }

  get username() {
    return this.form.get('username');
  }

  get email() {
    return this.form.get('email');
  }
}
