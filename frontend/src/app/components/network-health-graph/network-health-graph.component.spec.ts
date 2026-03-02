import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NetworkHealthGraphComponent } from './network-health-graph.component';

describe('NetworkHealthGraphComponent', () => {
  let component: NetworkHealthGraphComponent;
  let fixture: ComponentFixture<NetworkHealthGraphComponent>;

  const mockData = [
    {
      metrics: {
        bandwidth: { upload_mbps: 100, download_mbps: 50 },
        latency_ms: 25,
        uptime_percent: 99.5,
        packet_loss_percent: 0.1
      }
    },
    {
      metrics: {
        bandwidth: { upload_mbps: 120, download_mbps: 60 },
        latency_ms: 30,
        uptime_percent: 98.8,
        packet_loss_percent: 0.2
      }
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NetworkHealthGraphComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(NetworkHealthGraphComponent);
    component = fixture.componentInstance;
    component.data = mockData;
    component.metric = 'bandwidth';
    component.height = 250;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should process bandwidth data correctly', () => {
    component.metric = 'bandwidth';
    component.ngOnChanges();
    expect(component.graphPoints.length).toBe(2);
  });

  it('should process latency data correctly', () => {
    component.metric = 'latency';
    component.ngOnChanges();
    expect(component.graphPoints.length).toBe(2);
  });

  it('should process uptime data correctly', () => {
    component.metric = 'uptime';
    component.ngOnChanges();
    expect(component.graphPoints.length).toBe(2);
  });

  it('should process packet loss data correctly', () => {
    component.metric = 'packet_loss';
    component.ngOnChanges();
    expect(component.graphPoints.length).toBe(2);
  });

  it('should handle empty data', () => {
    component.data = [];
    component.ngOnChanges();
    expect(component.graphPoints.length).toBeGreaterThan(0); // Demo data is generated
  });

  it('should get correct metric label', () => {
    component.metric = 'bandwidth';
    expect(component.getMetricLabel()).toContain('Bandwidth');

    component.metric = 'latency';
    expect(component.getMetricLabel()).toContain('Latency');
  });

  it('should handle missing metric data gracefully', () => {
    const incompleteData = [{ metrics: {} }];
    component.data = incompleteData;
    component.metric = 'bandwidth';
    component.ngOnChanges();
    expect(component.graphPoints.length).toBe(1);
  });
});