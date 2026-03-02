import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Component } from '@angular/core';
import { of } from 'rxjs';
import { CollapsibleSidebarComponent } from './collapsible-sidebar.component';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({ 
  template: '',
  standalone: true
})
class DummyComponent { }

describe('CollapsibleSidebarComponent', () => {
  let component: CollapsibleSidebarComponent;
  let fixture: ComponentFixture<CollapsibleSidebarComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockThemeService: jasmine.SpyObj<ThemeService>;

  beforeEach(async () => {
    // Create spy objects
    mockAuthService = jasmine.createSpyObj('AuthService', [
      'getUsername',
      'getRoleDisplayName',
      'getRole',
      'isAdmin',
      'logout'
    ]);
    
    mockThemeService = jasmine.createSpyObj('ThemeService', ['toggleTheme'], {
      isDarkMode$: of(true)
    });

    // Set up default return values
    mockAuthService.getUsername.and.returnValue('testuser');
    mockAuthService.getRoleDisplayName.and.returnValue('Administrator');
    mockAuthService.getRole.and.returnValue('admin');
    mockAuthService.isAdmin.and.returnValue(true);

    await TestBed.configureTestingModule({
      imports: [
        CollapsibleSidebarComponent,
        RouterTestingModule.withRoutes([
          { path: 'home', component: DummyComponent },
          { path: 'dashboard', component: DummyComponent }
        ])
      ],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ThemeService, useValue: mockThemeService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CollapsibleSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render minimal sidebar component', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled).toBeTruthy();
  });
});