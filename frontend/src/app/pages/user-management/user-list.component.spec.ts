import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { UserListComponent } from './user-list.component';
import { UsersService, User } from '../../services/users.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { of, throwError } from 'rxjs';

describe('UserListComponent', () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;
  let usersService: jasmine.SpyObj<UsersService>;
  let authService: jasmine.SpyObj<AuthService>;
  let toastService: jasmine.SpyObj<ToastService>;

  const mockUsers: User[] = [
    { id: 1, _id: '1', username: 'user1', email: 'user1@test.com', is_admin: false, admin: false },
    { id: 2, _id: '2', username: 'admin1', email: 'admin@test.com', is_admin: true, admin: true },
    { id: 3, _id: '3', username: 'user2', email: 'user2@test.com', is_admin: false, admin: false }
  ];

  // Suppress console.error during error tests
  beforeAll(() => {
    spyOn(console, 'error');
  });

  beforeEach(async () => {
    const usersServiceSpy = jasmine.createSpyObj('UsersService', [
      'getUsers',
      'deleteUser'
    ]);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getUsername']);
    const toastServiceSpy = jasmine.createSpyObj('ToastService', [
      'success',
      'error',
      'warning'
    ]);

    await TestBed.configureTestingModule({
      imports: [UserListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: UsersService, useValue: usersServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy }
      ]
    }).compileComponents();

    usersService = TestBed.inject(UsersService) as jasmine.SpyObj<UsersService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    toastService = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;

    authService.getUsername.and.returnValue('admin1');

    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('loadUsers', () => {
    it('should load users successfully', () => {
      usersService.getUsers.and.returnValue(of(mockUsers));

      component.loadUsers();

      expect(usersService.getUsers).toHaveBeenCalled();
      expect(component.users.length).toBe(3);
      expect(component.loading).toBeFalse();
    });

    it('should handle error when loading users', (done) => {
      const error = { error: { message: 'API Error' } };
      usersService.getUsers.and.returnValue(throwError(() => error));

      component.loadUsers();

      // Wait for async operations to complete
      setTimeout(() => {
        expect(component.loading).toBeFalse();
        expect(toastService.error).toHaveBeenCalledWith('Failed to load users');
        done();
      }, 0);
    });

    it('should be called on component initialization', () => {
      usersService.getUsers.and.returnValue(of(mockUsers));

      component.ngOnInit();

      expect(usersService.getUsers).toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    it('should delete user after confirmation', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      usersService.deleteUser.and.returnValue(of({ message: 'User deleted' }));
      usersService.getUsers.and.returnValue(of(mockUsers));

      const userToDelete = mockUsers[0];
      component.deleteUser(userToDelete);

      expect(usersService.deleteUser).toHaveBeenCalledWith('1');
      expect(toastService.success).toHaveBeenCalledWith('User "user1" deleted successfully');
    });

    it('should not delete user if not confirmed', () => {
      spyOn(window, 'confirm').and.returnValue(false);

      component.deleteUser(mockUsers[0]);

      expect(usersService.deleteUser).not.toHaveBeenCalled();
    });

    it('should prevent deleting own account', () => {
      const currentUser = mockUsers[1]; // admin1

      component.deleteUser(currentUser);

      expect(toastService.warning).toHaveBeenCalledWith('You cannot delete your own account');
      expect(usersService.deleteUser).not.toHaveBeenCalled();
    });

    it('should handle delete error', (done) => {
      spyOn(window, 'confirm').and.returnValue(true);
      const error = { error: { error: 'Cannot delete user' } };
      usersService.deleteUser.and.returnValue(throwError(() => error));

      component.deleteUser(mockUsers[0]);

      // Wait for async operations to complete
      setTimeout(() => {
        expect(toastService.error).toHaveBeenCalledWith('Cannot delete user');
        done();
      }, 0);
    });
  });

  describe('isCurrentUser', () => {
    it('should return true for current user', () => {
      const currentUser = mockUsers[1]; // admin1

      expect(component.isCurrentUser(currentUser)).toBeTrue();
    });

    it('should return false for other users', () => {
      const otherUser = mockUsers[0]; // user1

      expect(component.isCurrentUser(otherUser)).toBeFalse();
    });
  });
});
