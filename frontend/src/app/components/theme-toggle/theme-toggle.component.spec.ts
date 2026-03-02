import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { ThemeToggleComponent } from './theme-toggle.component';
import { ThemeService } from '../../services/theme.service';

describe('ThemeToggleComponent', () => {
  let component: ThemeToggleComponent;
  let fixture: ComponentFixture<ThemeToggleComponent>;
  let mockThemeService: jasmine.SpyObj<ThemeService>;
  let isDarkModeSubject: Subject<boolean>;

  beforeEach(async () => {
    isDarkModeSubject = new Subject<boolean>();
    
    mockThemeService = jasmine.createSpyObj('ThemeService', [
      'toggleTheme'
    ], {
      isDarkMode$: isDarkModeSubject.asObservable()
    });

    await TestBed.configureTestingModule({
      imports: [ThemeToggleComponent],
      providers: [
        { provide: ThemeService, useValue: mockThemeService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ThemeToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with dark mode true', () => {
    expect(component.isDarkMode).toBe(true);
  });

  it('should update isDarkMode when theme service emits', () => {
    isDarkModeSubject.next(false);
    expect(component.isDarkMode).toBe(false);

    isDarkModeSubject.next(true);
    expect(component.isDarkMode).toBe(true);
  });

  it('should call theme service toggleTheme when button is clicked', () => {
    component.toggleTheme();
    expect(mockThemeService.toggleTheme).toHaveBeenCalled();
  });

  it('should render toggle button', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const toggleButton = compiled.querySelector('.theme-toggle-btn');
    expect(toggleButton).toBeTruthy();
  });

  it('should show correct aria-label for dark mode', () => {
    component.isDarkMode = true;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const toggleButton = compiled.querySelector('.theme-toggle-btn');
    expect(toggleButton?.getAttribute('aria-label')).toBe('Switch to light mode');
  });

  it('should show correct aria-label for light mode', () => {
    component.isDarkMode = false;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const toggleButton = compiled.querySelector('.theme-toggle-btn');
    expect(toggleButton?.getAttribute('aria-label')).toBe('Switch to dark mode');
  });

  it('should show correct title for dark mode', () => {
    component.isDarkMode = true;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const toggleButton = compiled.querySelector('.theme-toggle-btn');
    expect(toggleButton?.getAttribute('title')).toBe('Switch to light mode');
  });

  it('should show correct title for light mode', () => {
    component.isDarkMode = false;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const toggleButton = compiled.querySelector('.theme-toggle-btn');
    expect(toggleButton?.getAttribute('title')).toBe('Switch to dark mode');
  });

  it('should show active sun icon in light mode', () => {
    component.isDarkMode = false;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const sunIcon = compiled.querySelector('.sun-icon');
    const moonIcon = compiled.querySelector('.moon-icon');
    
    expect(sunIcon?.classList.contains('active')).toBe(true);
    expect(moonIcon?.classList.contains('active')).toBe(false);
  });

  it('should show active moon icon in dark mode', () => {
    component.isDarkMode = true;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const sunIcon = compiled.querySelector('.sun-icon');
    const moonIcon = compiled.querySelector('.moon-icon');
    
    expect(sunIcon?.classList.contains('active')).toBe(false);
    expect(moonIcon?.classList.contains('active')).toBe(true);
  });

  it('should render both sun and moon icons', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const sunIcon = compiled.querySelector('.sun-icon');
    const moonIcon = compiled.querySelector('.moon-icon');
    
    expect(sunIcon).toBeTruthy();
    expect(moonIcon).toBeTruthy();
    expect(sunIcon?.classList.contains('bi-sun-fill')).toBe(true);
    expect(moonIcon?.classList.contains('bi-moon-fill')).toBe(true);
  });

  it('should render icon container', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const iconContainer = compiled.querySelector('.toggle-icon-container');
    expect(iconContainer).toBeTruthy();
  });

  it('should call toggleTheme when button is clicked via DOM', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const toggleButton = compiled.querySelector('.theme-toggle-btn') as HTMLButtonElement;
    
    toggleButton.click();
    expect(mockThemeService.toggleTheme).toHaveBeenCalled();
  });

  it('should handle theme changes reactively', () => {
    // Start with dark mode
    isDarkModeSubject.next(true);
    expect(component.isDarkMode).toBe(true);
    
    // Switch to light mode
    isDarkModeSubject.next(false);
    expect(component.isDarkMode).toBe(false);
    
    // Switch back to dark mode
    isDarkModeSubject.next(true);
    expect(component.isDarkMode).toBe(true);
  });

  it('should subscribe to theme service on initialization', () => {
    // Component should already be subscribed from ngOnInit
    isDarkModeSubject.next(false);
    expect(component.isDarkMode).toBe(false);
  });

  it('should have proper button element', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const toggleButton = compiled.querySelector('.theme-toggle-btn') as HTMLButtonElement;
    expect(toggleButton.tagName.toLowerCase()).toBe('button');
  });
});