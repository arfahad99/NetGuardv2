import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { NetworkHealthComponent } from './network-health.component';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { ProbeService } from '../../services/probe.service';
import { of } from 'rxjs';

describe('NetworkHealthComponent', () => {
  let component: NetworkHealthComponent;
  let fixture: ComponentFixture<NetworkHealthComponent>;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockRecords = [
    { _id: '1', context: { site: 'HQ', interface: 'eth0' }, metrics: { bandwidth: { upload_mbps: 100, download_mbps: 200 }, latency_ms: 10, packet_loss_percent: 0.5, uptime_percent: 99.9 } },
    { _id: '2', context: { site: 'Branch', interface: 'eth1' }, metrics: { bandwidth: { upload_mbps: 50, download_mbps: 100 }, latency_ms: 25, packet_loss_percent: 2, uptime_percent: 95 } }
  ];

  const mockMeasurements = [
    { deviceId: 'home-probe-01', timestamp: '2026-03-03T10:00:00Z', latencyMs: 15, packetLoss: 0.5, downloadMbps: 85, uploadMbps: 20, uptimeStatus: 'online', alertFlag: false },
    { deviceId: 'home-probe-01', timestamp: '2026-03-03T10:30:00Z', latencyMs: 22, packetLoss: 0, downloadMbps: 92, uploadMbps: 25, uptimeStatus: 'online', alertFlag: false }
  ];

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['getNetworkHealth', 'createNetworkHealth', 'updateNetworkHealth', 'deleteNetworkHealth']);
    const toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'warning']);
    const probeSpy = jasmine.createSpyObj('ProbeService', ['getLatest', 'getHistory', 'getDevices']);
    apiSpy.getNetworkHealth.and.returnValue(of(mockRecords));
    probeSpy.getLatest.and.returnValue(of(mockMeasurements[0]));
    probeSpy.getHistory.and.returnValue(of(mockMeasurements));
    probeSpy.getDevices.and.returnValue(of({ devices: ['home-probe-01'] }));

    await TestBed.configureTestingModule({
      imports: [NetworkHealthComponent, HttpClientTestingModule, FormsModule],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: ToastService, useValue: toastSpy },
        { provide: ProbeService, useValue: probeSpy }
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

  it('should load measurement data from probe', () => {
    expect(component.latest).toBeTruthy();
    expect(component.latest?.latencyMs).toBe(15);
    expect(component.history.length).toBe(2);
  });

  it('should compute stats from history', () => {
    component.computeStats();
    expect(component.avgLatency).toBeGreaterThan(0);
    expect(component.avgDownload).toBeGreaterThan(0);
    expect(component.avgUpload).toBeGreaterThan(0);
    expect(component.uptimePercent).toBe(100);
    expect(component.totalMeasurements).toBe(2);
  });

  it('should compute zero stats for empty history', () => {
    component.history = [];
    component.computeStats();
    expect(component.avgLatency).toBe(0);
    expect(component.avgDownload).toBe(0);
    expect(component.uptimePercent).toBe(0);
  });

  it('should return correct latency class', () => {
    component.latest = { ...mockMeasurements[0], latencyMs: 120 };
    expect(component.getLatencyClass()).toBe('text-danger');
    component.latest = { ...mockMeasurements[0], latencyMs: 60 };
    expect(component.getLatencyClass()).toBe('text-warning');
    component.latest = { ...mockMeasurements[0], latencyMs: 20 };
    expect(component.getLatencyClass()).toBe('text-success');
  });

  it('should return correct packet loss class', () => {
    component.latest = { ...mockMeasurements[0], packetLoss: 10 };
    expect(component.getPacketLossClass()).toBe('text-danger');
    component.latest = { ...mockMeasurements[0], packetLoss: 2 };
    expect(component.getPacketLossClass()).toBe('text-warning');
    component.latest = { ...mockMeasurements[0], packetLoss: 0.5 };
    expect(component.getPacketLossClass()).toBe('text-success');
  });

  it('should return correct download class', () => {
    component.latest = { ...mockMeasurements[0], downloadMbps: 5 };
    expect(component.getDownloadClass()).toBe('text-danger');
    component.latest = { ...mockMeasurements[0], downloadMbps: 30 };
    expect(component.getDownloadClass()).toBe('text-warning');
    component.latest = { ...mockMeasurements[0], downloadMbps: 100 };
    expect(component.getDownloadClass()).toBe('text-success');
  });

  it('should format timestamps correctly', () => {
    const result = component.formatDate('2026-03-03T10:00:00Z');
    expect(result).toBeTruthy();
    expect(result).not.toBe('N/A');
  });

  it('should handle range change', () => {
    component.onRangeChange('7d');
    expect(component.range).toBe('7d');
  });

  it('should load device list', () => {
    expect(component.allDeviceIds.length).toBeGreaterThan(0);
    expect(component.allDeviceIds).toContain('home-probe-01');
  });
});
