import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { QosEventsComponent } from './qos-events.component';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { of, throwError } from 'rxjs';

describe('QosEventsComponent', () => {
  let component: QosEventsComponent;
  let fixture: ComponentFixture<QosEventsComponent>;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let toastSpy: jasmine.SpyObj<ToastService>;
  let authSpy: jasmine.SpyObj<AuthService>;

  const mockEvents = [
    {
      _id: '1',
      User_ID: 'user1',
      Application_Type: 'video_streaming',
      Signal_Strength: { value_dbm: -50, quality: 'Good' },
      Latency: { avg_ms: 25 },
      Allocated_Bandwidth: { mbps: 100 }
    },
    {
      _id: '2',
      User_ID: 'user2',
      Application_Type: 'voip',
      Signal_Strength: { value_dbm: -60, quality: 'Fair' },
      Latency: { avg_ms: 35 },
      Allocated_Bandwidth: { mbps: 50 }
    }
  ];

  beforeEach(async () => {
    const apiSpyObj = jasmine.createSpyObj('ApiService', ['getQosEvents', 'createQosEvent', 'updateQosEvent', 'deleteQosEvent']);
    const toastSpyObj = jasmine.createSpyObj('ToastService', ['success', 'error', 'warning']);
    const authSpyObj = jasmine.createSpyObj('AuthService', ['canEdit', 'canDelete', 'isGuest']);

    await TestBed.configureTestingModule({
      imports: [QosEventsComponent, HttpClientTestingModule, FormsModule],
      providers: [
        { provide: ApiService, useValue: apiSpyObj },
        { provide: ToastService, useValue: toastSpyObj },
        { provide: AuthService, useValue: authSpyObj }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(QosEventsComponent);
    component = fixture.componentInstance;
    apiSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    toastSpy = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    authSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    // Default spy returns
    apiSpy.getQosEvents.and.returnValue(of(mockEvents));
    authSpy.canEdit.and.returnValue(true);
    authSpy.canDelete.and.returnValue(true);
    authSpy.isGuest.and.returnValue(false);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load events on init', () => {
    component.ngOnInit();
    expect(apiSpy.getQosEvents).toHaveBeenCalledWith(1, 20);
    expect(component.events).toEqual(mockEvents);
    expect(component.filteredEvents).toEqual(mockEvents);
    expect(component.loading).toBeFalse();
  });

  it('should handle load events error', () => {
    apiSpy.getQosEvents.and.returnValue(throwError(() => new Error('API Error')));
    component.ngOnInit();
    expect(component.loading).toBeFalse();
    expect(toastSpy.error).toHaveBeenCalledWith('Failed to load events');
  });

  it('should filter events by search term', () => {
    component.events = mockEvents;
    component.searchTerm = 'user1';
    component.filterEvents();
    expect(component.filteredEvents.length).toBe(1);
    expect(component.filteredEvents[0].User_ID).toBe('user1');
  });

  it('should filter events by quality', () => {
    component.events = mockEvents;
    component.filterQuality = 'Good';
    component.filterEvents();
    expect(component.filteredEvents.length).toBe(1);
    expect(component.filteredEvents[0].Signal_Strength.quality).toBe('Good');
  });

  it('should get correct quality class', () => {
    expect(component.getQualityClass('Excellent')).toBe('online');
    expect(component.getQualityClass('Good')).toBe('active');
    expect(component.getQualityClass('Fair')).toBe('warning');
    expect(component.getQualityClass('Poor')).toBe('offline');
    expect(component.getQualityClass('Unknown')).toBe('active');
  });

  it('should open modal for adding event', () => {
    component.openModal();
    expect(component.showModal).toBeTrue();
    expect(component.isEditing).toBeFalse();
    expect(component.isViewing).toBeFalse();
  });

  it('should open modal for viewing event', () => {
    const event = mockEvents[0];
    component.viewEvent(event);
    expect(component.showModal).toBeTrue();
    expect(component.isViewing).toBeTrue();
    expect(component.isEditing).toBeFalse();
    expect(component.selectedEvent).toBe(event);
  });

  it('should open modal for editing event', () => {
    const event = mockEvents[0];
    component.editEvent(event);
    expect(component.showModal).toBeTrue();
    expect(component.isEditing).toBeTrue();
    expect(component.isViewing).toBeFalse();
    expect(component.selectedEvent).toBe(event);
    expect(component.form.user_id).toBe(event.User_ID);
  });

  it('should close modal', () => {
    component.showModal = true;
    component.selectedEvent = mockEvents[0];
    component.closeModal();
    expect(component.showModal).toBeFalse();
    expect(component.selectedEvent).toBeNull();
  });

  it('should save new event', () => {
    component.form = {
      user_id: 'newuser',
      application_type: 'gaming',
      signal_value_dbm: -45,
      latency_avg_ms: 20,
      signal_quality: 'Excellent'
    };
    apiSpy.createQosEvent.and.returnValue(of({}));
    spyOn(component, 'loadEvents');
    spyOn(component, 'closeModal');

    component.saveEvent();

    expect(apiSpy.createQosEvent).toHaveBeenCalled();
    expect(toastSpy.success).toHaveBeenCalledWith('Event created');
    expect(component.closeModal).toHaveBeenCalled();
    expect(component.loadEvents).toHaveBeenCalled();
  });

  it('should update existing event', () => {
    component.isEditing = true;
    component.selectedEvent = { _id: '1' };
    component.form = {
      user_id: 'updateduser',
      application_type: 'voip',
      signal_value_dbm: -55,
      latency_avg_ms: 30,
      signal_quality: 'Good'
    };
    apiSpy.updateQosEvent.and.returnValue(of({}));
    spyOn(component, 'loadEvents');
    spyOn(component, 'closeModal');

    component.saveEvent();

    expect(apiSpy.updateQosEvent).toHaveBeenCalledWith('1', jasmine.any(FormData));
    expect(toastSpy.success).toHaveBeenCalledWith('Event updated');
  });

  it('should show warning for invalid form', () => {
    component.form = { user_id: '', application_type: '', signal_value_dbm: 0, latency_avg_ms: 0, signal_quality: '' };
    component.saveEvent();
    expect(toastSpy.warning).toHaveBeenCalledWith('User ID and App Type are required');
  });

  it('should handle save error', () => {
    component.form = {
      user_id: 'user',
      application_type: 'gaming',
      signal_value_dbm: -45,
      latency_avg_ms: 20,
      signal_quality: 'Good'
    };
    apiSpy.createQosEvent.and.returnValue(throwError(() => new Error('Save failed')));

    component.saveEvent();

    expect(toastSpy.error).toHaveBeenCalledWith('Operation failed');
    expect(component.saving).toBeFalse();
  });

  it('should delete event with confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    apiSpy.deleteQosEvent.and.returnValue(of({}));
    spyOn(component, 'loadEvents');

    component.deleteEvent('1');

    expect(apiSpy.deleteQosEvent).toHaveBeenCalledWith('1');
    expect(toastSpy.success).toHaveBeenCalledWith('Event deleted');
    expect(component.loadEvents).toHaveBeenCalled();
  });

  it('should not delete event without confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    component.deleteEvent('1');
    expect(apiSpy.deleteQosEvent).not.toHaveBeenCalled();
  });

  it('should handle delete error', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    apiSpy.deleteQosEvent.and.returnValue(throwError(() => new Error('Delete failed')));

    component.deleteEvent('1');

    expect(toastSpy.error).toHaveBeenCalledWith('Delete failed');
  });

  it('should change page', () => {
    spyOn(component, 'loadEvents');
    component.currentPage = 1;
    component.changePage(1);
    expect(component.currentPage).toBe(2);
    expect(component.loadEvents).toHaveBeenCalled();
  });
});