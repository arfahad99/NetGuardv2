import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusBadgeComponent } from './status-badge.component';

describe('StatusBadgeComponent', () => {
  let component: StatusBadgeComponent;
  let fixture: ComponentFixture<StatusBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusBadgeComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(StatusBadgeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display default label for online status', () => {
    component.status = 'online';
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent?.trim()).toContain('Online');
  });

  it('should display custom label when provided', () => {
    component.status = 'online';
    component.label = 'Active';
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent?.trim()).toContain('Active');
  });

  it('should apply correct CSS class for online status', () => {
    component.status = 'online';
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const badge = compiled.querySelector('.badge-status');
    expect(badge?.classList.contains('badge-online')).toBeTruthy();
  });

  it('should apply correct CSS class for offline status', () => {
    component.status = 'offline';
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const badge = compiled.querySelector('.badge-status');
    expect(badge?.classList.contains('badge-offline')).toBeTruthy();
  });

  it('should apply correct CSS class for warning status', () => {
    component.status = 'warning';
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const badge = compiled.querySelector('.badge-status');
    expect(badge?.classList.contains('badge-warning')).toBeTruthy();
  });

  it('should apply correct CSS class for critical status', () => {
    component.status = 'critical';
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const badge = compiled.querySelector('.badge-status');
    expect(badge?.classList.contains('badge-critical')).toBeTruthy();
  });

  it('should apply default secondary class for unknown status', () => {
    component.status = 'unknown';
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const badge = compiled.querySelector('.badge-status');
    expect(badge?.classList.contains('badge-secondary')).toBeTruthy();
  });

  it('should handle empty status with default case', () => {
    component.status = '';
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent?.trim()).toContain('Unknown');
  });
});