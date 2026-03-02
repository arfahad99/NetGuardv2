import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Component } from '@angular/core';
import { AppHeaderComponent } from './app-header.component';
import { AuthService } from '../../services/auth.service';

@Component({ 
  template: '',
  standalone: true
})
class DummyComponent { }

describe('AppHeaderComponent', () => {
  let component: AppHeaderComponent;
  let fixture: ComponentFixture<AppHeaderComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    // Create spy objects
    mockAuthService = jasmine.createSpyObj('AuthService', [
      'isAdmin',
      'isGuest',
      'canEdit',
      'canDelete'
    ]);

    // Set up default return values
    mockAuthService.isAdmin.and.returnValue(true);
    mockAuthService.isGuest.and.returnValue(false);
    mockAuthService.canEdit.and.returnValue(true);
    mockAuthService.canDelete.and.returnValue(true);

    await TestBed.configureTestingModule({
      imports: [
        AppHeaderComponent,
        RouterTestingModule.withRoutes([
          { path: 'home', component: DummyComponent },
          { path: 'dashboard', component: DummyComponent },
          { path: 'devices', component: DummyComponent },
          { path: 'alerts', component: DummyComponent },
          { path: 'network-health', component: DummyComponent },
          { path: 'qos-events', component: DummyComponent },
          { path: 'sessions', component: DummyComponent },
          { path: 'manage-users', component: DummyComponent }
        ])
      ],
      providers: [
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppHeaderComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize responsive state', () => {
    expect(component.isMobile).toBeDefined();
    expect(component.isTablet).toBeDefined();
    expect(component.isDesktop).toBeDefined();
  });

  it('should update responsive state on window resize', () => {
    spyOn(component as any, 'updateResponsiveState');
    component.onWindowResize();
    expect((component as any).updateResponsiveState).toHaveBeenCalled();
  });

  it('should close mobile menu on document click outside', () => {
    component.isMobileMenuOpen = true;
    const mockEvent = new Event('click');
    Object.defineProperty(mockEvent, 'target', {
      value: document.createElement('div'),
      enumerable: true
    });
    
    component.onDocumentClick(mockEvent);
    expect(component.isMobileMenuOpen).toBe(false);
  });

  it('should close mobile menu on Escape key', () => {
    component.isMobileMenuOpen = true;
    const mockEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    spyOn(mockEvent, 'preventDefault');
    
    component.onKeyDown(mockEvent);
    expect(component.isMobileMenuOpen).toBe(false);
    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });

  it('should toggle mobile menu', () => {
    expect(component.isMobileMenuOpen).toBe(false);
    component.toggleMobileMenu();
    expect(component.isMobileMenuOpen).toBe(true);
    component.toggleMobileMenu();
    expect(component.isMobileMenuOpen).toBe(false);
  });

  it('should return correct screen size', () => {
    component.isMobile = true;
    component.isTablet = false;
    component.isDesktop = false;
    expect(component.screenSize).toBe('mobile');

    component.isMobile = false;
    component.isTablet = true;
    component.isDesktop = false;
    expect(component.screenSize).toBe('tablet');

    component.isMobile = false;
    component.isTablet = false;
    component.isDesktop = true;
    expect(component.screenSize).toBe('desktop');
  });

  it('should determine compact navigation correctly', () => {
    // Mock window.innerWidth
    spyOnProperty(window, 'innerWidth', 'get').and.returnValue(1200);
    mockAuthService.isAdmin.and.returnValue(true);
    expect(component.needsCompactNavigation()).toBe(true);

    mockAuthService.isAdmin.and.returnValue(false);
    expect(component.needsCompactNavigation()).toBe(false);
  });

  it('should return correct navigation labels', () => {
    spyOnProperty(window, 'innerWidth', 'get').and.returnValue(600);
    mockAuthService.isAdmin.and.returnValue(true);
    
    expect(component.getNavLabel('Dashboard')).toBe('Dash');
    expect(component.getNavLabel('Network Health')).toBe('Net');
    expect(component.getNavLabel('User Management')).toBe('Users');
  });

  it('should navigate and handle mobile menu', () => {
    component.isMobile = true;
    spyOn(window, 'setTimeout');
    spyOn(router, 'navigate');
    
    component.navigateAndCloseMenu('/dashboard');
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(window.setTimeout).toHaveBeenCalled();
  });

  it('should handle touch interactions', () => {
    const mockTouch = {
      clientX: 100,
      clientY: 100,
      identifier: 0,
      target: document.createElement('div'),
      screenX: 100,
      screenY: 100,
      pageX: 100,
      pageY: 100,
      radiusX: 1,
      radiusY: 1,
      rotationAngle: 0,
      force: 1
    } as Touch;
    
    const mockTouchEvent = {
      touches: [mockTouch],
      changedTouches: [mockTouch],
      targetTouches: [mockTouch],
      type: 'touchstart',
      preventDefault: jasmine.createSpy('preventDefault'),
      stopPropagation: jasmine.createSpy('stopPropagation')
    } as unknown as TouchEvent;
    
    component.onTouchStart(mockTouchEvent);
    expect(component['touchStartX']).toBe(100);
    expect(component['touchStartY']).toBe(100);
  });

  it('should clean up subscriptions on destroy', () => {
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');
    
    component.ngOnDestroy();
    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });

  it('should render navigation links', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const navLinks = compiled.querySelectorAll('.nav-tab');
    expect(navLinks.length).toBeGreaterThan(0);
  });

  it('should show admin-only navigation when user is admin', () => {
    mockAuthService.isAdmin.and.returnValue(true);
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const adminLink = compiled.querySelector('.nav-tab.admin-only');
    expect(adminLink).toBeTruthy();
  });

  it('should hide admin-only navigation when user is not admin', () => {
    mockAuthService.isAdmin.and.returnValue(false);
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const adminLink = compiled.querySelector('.nav-tab.admin-only');
    expect(adminLink).toBeFalsy();
  });

  it('should display brand logo and navigation', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const brandLogo = compiled.querySelector('.brand-logo');
    const navTabs = compiled.querySelector('.nav-tabs');
    expect(brandLogo).toBeTruthy();
    expect(navTabs).toBeTruthy();
  });

  it('should show mobile menu button on mobile/tablet', () => {
    component.isMobile = true;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const mobileMenuBtn = compiled.querySelector('.mobile-menu-btn');
    expect(mobileMenuBtn).toBeTruthy();
  });
});