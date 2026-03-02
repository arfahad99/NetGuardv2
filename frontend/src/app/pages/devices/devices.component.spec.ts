import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { DevicesComponent } from './devices.component';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { of } from 'rxjs';

describe('DevicesComponent', () => {
  let component: DevicesComponent;
  let fixture: ComponentFixture<DevicesComponent>;
  let apiService: jasmine.SpyObj<ApiService>;
  let toastService: jasmine.SpyObj<ToastService>;
  let authService: jasmine.SpyObj<AuthService>;

  const mockDevices = [
    { _id: '1', name: 'Router1', type: 'router', status: { state: 'online' }, network: { primary_ip: '192.168.1.1' }, system: { os: 'Linux' } },
    { _id: '2', name: 'Switch1', type: 'switch', status: { state: 'offline' }, network: { primary_ip: '192.168.1.2' }, system: { os: 'Cisco IOS' } }
  ];

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['getDevices', 'createDevice', 'updateDevice', 'deleteDevice']);
    const toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'warning']);
    const authSpy = jasmine.createSpyObj('AuthService', ['canEdit', 'canDelete', 'canCreate']);
    
    apiSpy.getDevices.and.returnValue(of(mockDevices));
    authSpy.canEdit.and.returnValue(true);
    authSpy.canDelete.and.returnValue(true);
    authSpy.canCreate.and.returnValue(true);

    await TestBed.configureTestingModule({
      imports: [DevicesComponent, HttpClientTestingModule, FormsModule],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: ToastService, useValue: toastSpy },
        { provide: AuthService, useValue: authSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DevicesComponent);
    component = fixture.componentInstance;
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    toastService = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load devices on init', () => {
    expect(apiService.getDevices).toHaveBeenCalled();
    expect(component.devices.length).toBe(2);
  });

  it('should filter devices by search term', () => {
    component.searchTerm = 'Router';
    component.filterDevices();
    expect(component.filteredDevices.length).toBe(1);
    expect(component.filteredDevices[0].name).toBe('Router1');
  });

  it('should filter devices by status', () => {
    component.filterStatus = 'online';
    component.filterDevices();
    expect(component.filteredDevices.length).toBe(1);
  });

  it('should filter devices by type', () => {
    component.filterType = 'switch';
    component.filterDevices();
    expect(component.filteredDevices.length).toBe(1);
  });

  it('should open modal for adding device', () => {
    component.openModal();
    expect(component.showModal).toBeTrue();
    expect(component.isEditing).toBeFalse();
  });

  it('should open modal for editing device', () => {
    component.editDevice(mockDevices[0]);
    expect(component.showModal).toBeTrue();
    expect(component.isEditing).toBeTrue();
    expect(component.form.name).toBe('Router1');
  });

  it('should open modal for viewing device', () => {
    component.viewDevice(mockDevices[0]);
    expect(component.showModal).toBeTrue();
    expect(component.isViewing).toBeTrue();
  });

  it('should close modal', () => {
    component.showModal = true;
    component.closeModal();
    expect(component.showModal).toBeFalse();
  });

  it('should show warning when required fields are empty', () => {
    component.form.name = '';
    component.form.type = '';
    component.saveDevice();
    expect(toastService.warning).toHaveBeenCalled();
  });

  it('should delete device with confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    apiService.deleteDevice.and.returnValue(of({ message: 'Device deleted' }));
    component.deleteDevice('1');
    expect(apiService.deleteDevice).toHaveBeenCalledWith('1');
  });
});
