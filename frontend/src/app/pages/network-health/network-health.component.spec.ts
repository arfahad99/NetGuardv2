import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { NetworkHealthComponent } from './network-health.component';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { of } from 'rxjs';

describe('NetworkHealthComponent', () => {
  let component: NetworkHealthComponent;
  let fixture: ComponentFixture<NetworkHealthComponent>;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockRecords = [
    { _id: '1', context: { site: 'HQ', interface: 'eth0' }, metrics: { bandwidth: { upload_mbps: 100, download_mbps: 200 }, latency_ms: 10, packet_loss_percent: 0.5, uptime_percent: 99.9 } },
    { _id: '2', context: { site: 'Branch', interface: 'eth1' }, metrics: { bandwidth: { upload_mbps: 50, download_mbps: 100 }, latency_ms: 25, packet_loss_percent: 2, uptime_percent: 95 } }
  ];

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['getNetworkHealth', 'createNetworkHealth', 'updateNetworkHealth', 'deleteNetworkHealth']);
    const toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'warning']);
    apiSpy.getNetworkHealth.and.returnValue(of(mockRecords));

    await TestBed.configureTestingModule({
      imports: [NetworkHealthComponent, HttpClientTestingModule, FormsModule],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: ToastService, useValue: toastSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NetworkHealthComponent);
    component = fixture.componentInstance;
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load records and extract unique sites', () => {
    expect(component.records.length).toBe(2);
    expect(component.uniqueSites).toContain('HQ');
    expect(component.uniqueSites).toContain('Branch');
  });

  it('should filter by site', () => {
    component.filterSite = 'HQ';
    component.filterRecords();
    expect(component.filteredRecords.length).toBe(1);
  });

  it('should return correct uptime class', () => {
    expect(component.getUptimeClass(99.9)).toBe('online');
    expect(component.getUptimeClass(96)).toBe('warning');
    expect(component.getUptimeClass(90)).toBe('offline');
  });
});
