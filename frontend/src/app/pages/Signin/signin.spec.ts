import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SigninComponent } from './signin';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('SigninComponent', () => {
  let component: SigninComponent;
  let fixture: ComponentFixture<SigninComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SigninComponent, HttpClientTestingModule, RouterTestingModule, BrowserAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(SigninComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should validate username', () => {
    component.username = 'ab';
    component.validateUsername();
    expect(component.usernameError).toBeTruthy();

    component.username = 'validuser';
    component.validateUsername();
    expect(component.usernameError).toBe('');
  });

  it('should validate password', () => {
    component.password = '12345';
    component.validatePassword();
    expect(component.passwordError).toBeTruthy();

    component.password = 'validpass123';
    component.validatePassword();
    expect(component.passwordError).toBe('');
  });
});
