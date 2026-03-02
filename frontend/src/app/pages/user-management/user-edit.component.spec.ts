import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { UserEditComponent } from './user-edit.component';
import { UsersService } from '../../services/users.service';
import { ToastService } from '../../services/toast.service';
import { of } from 'rxjs';

describe('UserEditComponent', () => {
  let component: UserEditComponent;
  let fixture: ComponentFixture<UserEditComponent>;

  beforeEach(async () => {
    const usersServiceSpy = jasmine.createSpyObj('UsersService', ['getUser', 'updateUser']);
    const toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'warning']);

    await TestBed.configureTestingModule({
      imports: [UserEditComponent, ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: UsersService, useValue: usersServiceSpy },
        { provide: ToastService, useValue: toastSpy },
        {
          provide: ActivatedRoute,
          useValue: { params: of({ id: '1' }) }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserEditComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form', () => {
    expect(component.form).toBeDefined();
    expect(component.form.get('username')).toBeDefined();
    expect(component.form.get('email')).toBeDefined();
  });

  it('should have form controls', () => {
    expect(component.form.get('username')).toBeTruthy();
    expect(component.form.get('email')).toBeTruthy();
  });
});