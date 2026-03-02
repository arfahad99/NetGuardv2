import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideHttpClient } from '@angular/common/http';
import { MainLayoutComponent } from './main-layout.component';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

describe('MainLayoutComponent', () => {
  let component: MainLayoutComponent;
  let fixture: ComponentFixture<MainLayoutComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['getUsername', 'signout']);
    const toastSpy = jasmine.createSpyObj('ToastService', ['success']);

    authSpy.getUsername.and.returnValue('TestUser');

    await TestBed.configureTestingModule({
      imports: [MainLayoutComponent, RouterTestingModule],
      providers: [
        provideHttpClient(),
        { provide: AuthService, useValue: authSpy },
        { provide: ToastService, useValue: toastSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MainLayoutComponent);
    component = fixture.componentInstance;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    toastServiceSpy = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize username from auth service', () => {
    expect(component.username).toBe('TestUser');
    expect(authServiceSpy.getUsername).toHaveBeenCalled();
  });

  it('should fallback to "User" when no username available', () => {
    authServiceSpy.getUsername.and.returnValue(null);
    const newComponent = new MainLayoutComponent(authServiceSpy, jasmine.createSpyObj('Router', ['navigate']), toastServiceSpy);
    expect(newComponent.username).toBe('User');
  });

  it('should have username property', () => {
    expect(component.username).toBeDefined();
    expect(typeof component.username).toBe('string');
  });
});