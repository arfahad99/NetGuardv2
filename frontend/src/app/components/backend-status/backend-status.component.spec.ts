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

    // We just need a simple mock that returns observables
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

  afterEach(() => {
    // Prevent Memory Leaks between tests affecting observables
    if (component && component['subscription']) {
      component['subscription'].unsubscribe();
    }
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
    // Explicit call to change detection is needed when Subjects push new async data
    fixture.detectChanges();
    expect(component.isBackendAvailable).toBe(true);
    expect(component.lastCheckTime).toBeInstanceOf(Date);
  });

  it('should show Cloud Reconnecting text when backend is unavailable', () => {
    component.isBackendAvailable = false;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const indicator = compiled.querySelector('.backend-status-indicator');
    expect(indicator?.textContent).toContain('Cloud Reconnecting...');
    expect(indicator?.classList.contains('offline')).toBe(true);
  });

  it('should show Cloud Connected text when backend is available', () => {
    component.isBackendAvailable = true;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const indicator = compiled.querySelector('.backend-status-indicator');
    expect(indicator?.textContent).toContain('Cloud Connected');
    expect(indicator?.classList.contains('online')).toBe(true);
  });

  it('should call forceHealthCheck when retrying connection', () => {
    component.retryConnection();
    expect(mockBackendHealthService.forceHealthCheck).toHaveBeenCalled();
  });

  it('should reset isRetrying after successful retry', () => {
    mockBackendHealthService.forceHealthCheck.and.returnValue(of(true));

    component.retryConnection();
    // Observable `of` executes synchronously so we can check immediately
    expect(component.isRetrying).toBe(false);
    expect(component.isBackendAvailable).toBe(true);
  });

  it('should handle retry connection errors gracefully', () => {
    mockBackendHealthService.forceHealthCheck.and.returnValue(throwError(() => new Error('Connection failed')));

    component.retryConnection();
    // Since it failed, we expect isRetrying to be reset to false
    expect(component.isRetrying).toBe(false);
  });

});