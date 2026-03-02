import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { UserCreateComponent } from './user-create.component';
import { UsersService } from '../../services/users.service';
import { ToastService } from '../../services/toast.service';
import { of, throwError } from 'rxjs';

describe('UserCreateComponent', () => {
  let component: UserCreateComponent;
  let fixture: ComponentFixture<UserCreateComponent>;
  let usersServiceSpy: jasmine.SpyObj<UsersService>;
  let toastSpy: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    const usersServiceSpyObj = jasmine.createSpyObj('UsersService', ['createUser']);
    const toastSpyObj = jasmine.createSpyObj('ToastService', ['success', 'error', 'warning']);

    await TestBed.configureTestingModule({
      imports: [UserCreateComponent, ReactiveFormsModule],
      providers: [
        provideRouter([]),
        { provide: UsersService, useValue: usersServiceSpyObj },
        { provide: ToastService, useValue: toastSpyObj }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserCreateComponent);
    component = fixture.componentInstance;
    usersServiceSpy = TestBed.inject(UsersService) as jasmine.SpyObj<UsersService>;
    toastSpy = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values', () => {
    expect(component.form.get('username')?.value).toBe('');
    expect(component.form.get('email')?.value).toBe('');
    expect(component.form.get('password')?.value).toBe('');
    expect(component.form.get('admin')?.value).toBeFalse();
  });

  it('should validate required fields', () => {
    component.onSubmit();
    expect(toastSpy.warning).toHaveBeenCalledWith('Please fill in all required fields correctly');
    expect(usersServiceSpy.createUser).not.toHaveBeenCalled();
  });

  it('should create user successfully', () => {
    component.form.patchValue({
      username: 'newuser',
      email: 'newuser@example.com',
      password: 'password123',
      admin: false
    });

    usersServiceSpy.createUser.and.returnValue(of({} as any));
    spyOn(component['router'], 'navigate');

    component.onSubmit();

    expect(usersServiceSpy.createUser).toHaveBeenCalled();
    expect(toastSpy.success).toHaveBeenCalledWith('User created successfully');
  });

  it('should handle create user error', () => {
    component.form.patchValue({
      username: 'newuser',
      email: 'newuser@example.com',
      password: 'password123',
      admin: false
    });

    const errorResponse = { error: { error: 'Username already exists' } };
    usersServiceSpy.createUser.and.returnValue(throwError(() => errorResponse));

    component.onSubmit();

    expect(toastSpy.error).toHaveBeenCalledWith('Username already exists');
    expect(component.submitting).toBeFalse();
  });

  it('should toggle password visibility', () => {
    expect(component.showPassword).toBeFalse();
    component.togglePasswordVisibility();
    expect(component.showPassword).toBeTrue();
    component.togglePasswordVisibility();
    expect(component.showPassword).toBeFalse();
  });

  it('should navigate back on cancel', () => {
    spyOn(component['router'], 'navigate');
    component.cancel();
    expect(component['router'].navigate).toHaveBeenCalledWith(['/manage-users']);
  });
});