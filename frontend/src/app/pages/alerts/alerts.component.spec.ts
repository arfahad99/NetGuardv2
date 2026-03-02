import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { AlertsComponent } from './alerts.component';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { of } from 'rxjs';

describe('AlertsComponent', () => {
  let component: AlertsComponent;
  let fixture: ComponentFixture<AlertsComponent>;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockAlerts = [
    { _id: '1', type: 'CPU', severity: 'critical', status: 'active', message: 'High CPU usage', device: { device_id: 1, interface: 'eth0' } },
    { _id: '2', type: 'Memory', severity: 'high', status: 'resolved', message: 'Memory warning', device: { device_id: 2, interface: 'eth1' } }
  ];

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['getAlerts', 'createAlert', 'updateAlert', 'deleteAlert']);
    const toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'warning']);
    apiSpy.getAlerts.and.returnValue(of(mockAlerts));

    await TestBed.configureTestingModule({
      imports: [AlertsComponent, HttpClientTestingModule, FormsModule],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: ToastService, useValue: toastSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AlertsComponent);
    component = fixture.componentInstance;
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load alerts on init', () => {
    expect(apiService.getAlerts).toHaveBeenCalled();
    expect(component.alerts.length).toBe(2);
  });

  it('should filter alerts by severity', () => {
    component.filterSeverity = 'critical';
    component.filterAlerts();
    expect(component.filteredAlerts.length).toBe(1);
  });

  it('should filter alerts by status', () => {
    component.filterAlertStatus = 'active';
    component.filterAlerts();
    expect(component.filteredAlerts.length).toBe(1);
  });

  it('should return correct severity class', () => {
    expect(component.getSeverityClass('critical')).toBe('critical');
    expect(component.getSeverityClass('high')).toBe('warning');
    expect(component.getSeverityClass('low')).toBe('online');
  });

  it('should open and close modal', () => {
    component.openModal();
    expect(component.showModal).toBeTrue();
    component.closeModal();
    expect(component.showModal).toBeFalse();
  });
});
