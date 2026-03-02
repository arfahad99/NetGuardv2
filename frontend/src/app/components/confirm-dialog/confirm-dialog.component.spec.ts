import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialogComponent } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  let component: ConfirmDialogComponent;
  let fixture: ComponentFixture<ConfirmDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit confirmed event', () => {
    spyOn(component.confirmed, 'emit');
    component.onConfirm();
    expect(component.confirmed.emit).toHaveBeenCalled();
  });

  it('should emit cancelled event', () => {
    spyOn(component.cancelled, 'emit');
    component.onCancel();
    expect(component.cancelled.emit).toHaveBeenCalled();
  });

  it('should display title and message when shown', () => {
    component.show = true;
    component.title = 'Test Title';
    component.message = 'Test Message';
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Test Title');
    expect(compiled.textContent).toContain('Test Message');
  });

  it('should not display content when hidden', () => {
    component.show = false;
    component.title = 'Test Title';
    component.message = 'Test Message';
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).not.toContain('Test Title');
    expect(compiled.textContent).not.toContain('Test Message');
  });

  it('should have default properties', () => {
    expect(component.show).toBeFalse();
    expect(component.title).toBe('Confirm Action');
    expect(component.message).toBe('Are you sure you want to proceed?');
    expect(component.confirmText).toBe('Confirm');
    expect(component.type).toBe('danger');
  });
});