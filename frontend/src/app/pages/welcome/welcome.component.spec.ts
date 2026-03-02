import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { WelcomeComponent } from './welcome.component';
import { BackgroundBeamsComponent } from '../../components/background-beams/background-beams.component';
import { AuthService } from '../../services/auth.service';

describe('WelcomeComponent', () => {
  let component: WelcomeComponent;
  let fixture: ComponentFixture<WelcomeComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['getUsername']);
    authSpy.getUsername.and.returnValue('TestUser');

    await TestBed.configureTestingModule({
      imports: [WelcomeComponent, BackgroundBeamsComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: AuthService, useValue: authSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WelcomeComponent);
    component = fixture.componentInstance;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
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
    const newComponent = new WelcomeComponent(authServiceSpy);
    expect(newComponent.username).toBe('User');
  });

  it('should have username property', () => {
    expect(component.username).toBeDefined();
    expect(typeof component.username).toBe('string');
  });
});