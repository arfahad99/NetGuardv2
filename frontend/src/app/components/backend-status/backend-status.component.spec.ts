import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { BackendStatusComponent } from './backend-status.component';
import { BackendHealthService } from '../../services/backend-health.service';

describe('BackendStatusComponent', () => {
  let component: BackendStatusComponent;
  let fixture: ComponentFixture<BackendStatusComponent>;
  let mockBackendHealthService: jasmine.SpyObj<BackendHealthService>;
  let backendStatusSubject: Subject<boolean>;

  beforeEach(async () => {
    backendStatusSubject = new Subject<boolean>();
    
    mockBackendHealthService = jasmine.createSpyObj('BackendHealthService', [
      'forceHealthCheck'
    ], {
      backendStatus$: backendStatusSubject.asObservable()
    });

    mockBackendHealthService.forceHealthCheck.and.returnValue(of(true));

    await TestBed.configureTestingModule({
      imports: [BackendStatusComponent],
      providers: [
        { provide: BackendHealthService, useValue: mockBackendHealthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BackendStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with correct default values', () => {
    expect(component.isRetrying).toBe(false);
    expect(component.showInstructions).toBe(false);
    expect(component.serverUrl).toBe('http://127.0.0.1:5001');
  });

  it('should set server URL on initialization', () => {
    expect(component.serverUrl).toBe('http://127.0.0.1:5001');
  });

  it('should update backend status when service emits', () => {
    backendStatusSubject.next(true);
    expect(component.isBackendAvailable).toBe(true);
    expect(component.lastCheckTime).toBeInstanceOf(Date);
  });

  it('should show overlay when backend is unavailable', () => {
    component.isBackendAvailable = false;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const overlay = compiled.querySelector('.backend-status-overlay');
    expect(overlay).toBeTruthy();
  });

  it('should hide overlay when backend is available', () => {
    component.isBackendAvailable = true;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const overlay = compiled.querySelector('.backend-status-overlay');
    expect(overlay).toBeFalsy();
  });

  it('should show status indicator when backend is available', () => {
    component.isBackendAvailable = true;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const indicator = compiled.querySelector('.backend-status-indicator');
    expect(indicator).toBeTruthy();
    expect(indicator?.classList.contains('online')).toBe(true);
  });

  it('should display server URL in overlay', () => {
    component.isBackendAvailable = false;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const serverUrlElement = compiled.querySelector('.detail-item code');
    expect(serverUrlElement?.textContent?.trim()).toBe('http://127.0.0.1:5001');
  });

  it('should call retry connection on button click', () => {
    component.isBackendAvailable = false;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const retryButton = compiled.querySelector('.btn-primary') as HTMLButtonElement;
    
    retryButton.click();
    expect(mockBackendHealthService.forceHealthCheck).toHaveBeenCalled();
  });

  it('should toggle instructions visibility', () => {
    component.isBackendAvailable = false;
    component.showInstructions = false;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const instructionsButton = compiled.querySelector('.btn-outline-secondary') as HTMLButtonElement;
    
    instructionsButton.click();
    expect(component.showInstructions).toBe(true);
    
    fixture.detectChanges();
    const instructions = compiled.querySelector('.instructions');
    expect(instructions).toBeTruthy();
  });

  it('should show instructions when showInstructions is true', () => {
    component.isBackendAvailable = false;
    component.showInstructions = true;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const instructions = compiled.querySelector('.instructions');
    expect(instructions).toBeTruthy();
    
    const instructionsList = instructions?.querySelector('ol');
    expect(instructionsList?.children.length).toBe(4);
  });

  it('should hide instructions when showInstructions is false', () => {
    component.isBackendAvailable = false;
    component.showInstructions = false;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const instructions = compiled.querySelector('.instructions');
    expect(instructions).toBeFalsy();
  });

  it('should call forceHealthCheck when retrying connection', () => {
    component.retryConnection();
    expect(mockBackendHealthService.forceHealthCheck).toHaveBeenCalled();
  });

  it('should reset isRetrying after successful retry', () => {
    mockBackendHealthService.forceHealthCheck.and.returnValue(of(true));
    
    component.retryConnection();
    expect(component.isRetrying).toBe(false);
    expect(component.isBackendAvailable).toBe(true);
  });

  it('should handle retry connection errors', () => {
    const errorSubject = new Subject<boolean>();
    mockBackendHealthService.forceHealthCheck.and.returnValue(errorSubject.asObservable());
    
    component.retryConnection();
    expect(component.isRetrying).toBe(true);
    
    errorSubject.error(new Error('Connection failed'));
    expect(component.isRetrying).toBe(false);
  });

  it('should disable retry button when retrying', () => {
    component.isBackendAvailable = false;
    component.isRetrying = true;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const retryButton = compiled.querySelector('.btn-primary') as HTMLButtonElement;
    expect(retryButton.disabled).toBe(true);
  });

  it('should show checking text when retrying', () => {
    component.isBackendAvailable = false;
    component.isRetrying = true;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const retryButton = compiled.querySelector('.btn-primary');
    expect(retryButton?.textContent?.trim()).toContain('Checking...');
  });

  it('should show retry connection text when not retrying', () => {
    component.isBackendAvailable = false;
    component.isRetrying = false;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const retryButton = compiled.querySelector('.btn-primary');
    expect(retryButton?.textContent?.trim()).toContain('Retry Connection');
  });

  it('should display last check time', () => {
    const testDate = new Date('2023-01-01T12:00:00Z');
    component.lastCheckTime = testDate;
    component.isBackendAvailable = false;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const timeElement = compiled.querySelector('.detail-item:nth-child(2) span');
    expect(timeElement?.textContent).toContain('Last Check:');
  });

  it('should show spin animation when retrying', () => {
    component.isBackendAvailable = false;
    component.isRetrying = true;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const spinIcon = compiled.querySelector('.bi-arrow-clockwise.spin');
    expect(spinIcon).toBeTruthy();
  });

  it('should unsubscribe on destroy', () => {
    spyOn(component['subscription']!, 'unsubscribe');
    component.ngOnDestroy();
    expect(component['subscription']!.unsubscribe).toHaveBeenCalled();
  });

  it('should handle subscription cleanup when subscription is undefined', () => {
    component['subscription'] = undefined;
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  it('should force initial health check on init', () => {
    expect(mockBackendHealthService.forceHealthCheck).toHaveBeenCalled();
  });
});