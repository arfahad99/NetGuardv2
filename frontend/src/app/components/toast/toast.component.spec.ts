import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastComponent } from './toast.component';
import { ToastService } from '../../services/toast.service';

describe('ToastComponent', () => {
  let component: ToastComponent;
  let fixture: ComponentFixture<ToastComponent>;
  let toastService: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastComponent],
      providers: [ToastService]
    }).compileComponents();

    fixture = TestBed.createComponent(ToastComponent);
    component = fixture.componentInstance;
    toastService = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display toasts from service', () => {
    toastService.success('Test message');
    fixture.detectChanges();
    expect(component.toasts.length).toBe(1);
  });

  it('should remove toast', () => {
    toastService.success('Test');
    fixture.detectChanges();
    const toastId = component.toasts[0].id;
    component.removeToast(toastId);
    expect(component.toasts.length).toBe(0);
  });
});
