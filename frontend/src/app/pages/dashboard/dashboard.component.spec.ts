import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { DashboardComponent } from './dashboard.component';
import { ApiService } from '../../services/api.service';
import { of } from 'rxjs';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let apiService: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['getDevices', 'getAlerts', 'getNetworkHealth', 'getSessions']);
    apiSpy.getDevices.and.returnValue(of([{ _id: '1', name: 'Device1' }]));
    apiSpy.getAlerts.and.returnValue(of([{ _id: '1', type: 'Alert1' }]));
    apiSpy.getNetworkHealth.and.returnValue(of([{ _id: '1' }]));
    apiSpy.getSessions.and.returnValue(of([{ _id: '1' }]));

    await TestBed.configureTestingModule({
      imports: [DashboardComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [{ provide: ApiService, useValue: apiSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load all data on init', () => {
    expect(apiService.getDevices).toHaveBeenCalled();
    expect(apiService.getAlerts).toHaveBeenCalled();
    expect(apiService.getNetworkHealth).toHaveBeenCalled();
    expect(apiService.getSessions).toHaveBeenCalled();
  });

  it('should update stats after loading', () => {
    expect(component.stats.devices).toBe(1);
    expect(component.stats.alerts).toBe(1);
  });

  it('should update current time', fakeAsync(() => {
    const initialTime = component.currentTime;
    tick(1000);
    component.updateTime();
    expect(component.currentTime).toBeTruthy();
  }));

  it('should set loading to false after data loads', () => {
    expect(component.loading).toBeFalse();
  });
});
