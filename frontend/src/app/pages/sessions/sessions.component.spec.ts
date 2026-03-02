import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { SessionsComponent } from './sessions.component';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { of, throwError } from 'rxjs';

describe('SessionsComponent', () => {
  let component: SessionsComponent;
  let fixture: ComponentFixture<SessionsComponent>;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let toastSpy: jasmine.SpyObj<ToastService>;
  let authSpy: jasmine.SpyObj<AuthService>;

  const mockSessions = [
    {
      _id: '1',
      session_id: 'sess_001',
      user_ref: { user_id: 'user1' },
      context: {
        temporal: {
          day_of_week: 'Monday',
          time_segment: 'morning',
          hour: 9,
          is_peak_hour: true
        }
      },
      metrics_summary: {
        duration_sec: 300,
        avg_latency_ms: 25
      }
    },
    {
      _id: '2',
      session_id: 'sess_002',
      user_ref: { user_id: 'user2' },
      context: {
        temporal: {
          day_of_week: 'Tuesday',
          time_segment: 'evening',
          hour: 20,
          is_peak_hour: false
        }
      },
      metrics_summary: {
        duration_sec: 450,
        avg_latency_ms: 30
      }
    }
  ];

  beforeEach(async () => {
    const apiSpyObj = jasmine.createSpyObj('ApiService', ['getSessions', 'createSession', 'updateSession', 'deleteSession']);
    const toastSpyObj = jasmine.createSpyObj('ToastService', ['success', 'error', 'warning']);
    const authSpyObj = jasmine.createSpyObj('AuthService', ['canEdit', 'canDelete', 'isGuest']);

    await TestBed.configureTestingModule({
      imports: [SessionsComponent, HttpClientTestingModule, FormsModule],
      providers: [
        { provide: ApiService, useValue: apiSpyObj },
        { provide: ToastService, useValue: toastSpyObj },
        { provide: AuthService, useValue: authSpyObj }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SessionsComponent);
    component = fixture.componentInstance;
    apiSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    toastSpy = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    authSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    // Default spy returns
    apiSpy.getSessions.and.returnValue(of(mockSessions));
    authSpy.canEdit.and.returnValue(true);
    authSpy.canDelete.and.returnValue(true);
    authSpy.isGuest.and.returnValue(false);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load sessions on init', () => {
    component.ngOnInit();
    expect(apiSpy.getSessions).toHaveBeenCalledWith(1, 20);
    expect(component.sessions).toEqual(mockSessions);
    expect(component.filteredSessions).toEqual(mockSessions);
    expect(component.loading).toBeFalse();
  });

  it('should handle load sessions error', () => {
    apiSpy.getSessions.and.returnValue(throwError(() => new Error('API Error')));
    component.ngOnInit();
    expect(component.loading).toBeFalse();
    expect(toastSpy.error).toHaveBeenCalledWith('Failed to load sessions');
  });

  it('should filter sessions by search term', () => {
    component.sessions = mockSessions;
    component.searchTerm = 'sess_001';
    component.filterSessions();
    expect(component.filteredSessions.length).toBe(1);
    expect(component.filteredSessions[0].session_id).toBe('sess_001');
  });

  it('should filter sessions by day', () => {
    component.sessions = mockSessions;
    component.filterDay = 'Monday';
    component.filterSessions();
    expect(component.filteredSessions.length).toBe(1);
    expect(component.filteredSessions[0].context.temporal.day_of_week).toBe('Monday');
  });

  it('should filter sessions by peak hours', () => {
    component.sessions = mockSessions;
    component.filterPeak = 'true';
    component.filterSessions();
    expect(component.filteredSessions.length).toBe(1);
    expect(component.filteredSessions[0].context.temporal.is_peak_hour).toBeTrue();
  });

  it('should open modal for adding session', () => {
    component.openModal();
    expect(component.showModal).toBeTrue();
    expect(component.isEditing).toBeFalse();
    expect(component.isViewing).toBeFalse();
  });

  it('should open modal for viewing session', () => {
    const session = mockSessions[0];
    component.viewSession(session);
    expect(component.showModal).toBeTrue();
    expect(component.isViewing).toBeTrue();
    expect(component.isEditing).toBeFalse();
    expect(component.selectedSession).toBe(session);
  });

  it('should open modal for editing session', () => {
    const session = mockSessions[0];
    component.editSession(session);
    expect(component.showModal).toBeTrue();
    expect(component.isEditing).toBeTrue();
    expect(component.isViewing).toBeFalse();
    expect(component.selectedSession).toBe(session);
    expect(component.form.session_id).toBe(session.session_id);
  });

  it('should close modal', () => {
    component.showModal = true;
    component.selectedSession = mockSessions[0];
    component.closeModal();
    expect(component.showModal).toBeFalse();
    expect(component.selectedSession).toBeNull();
  });

  it('should save new session', () => {
    component.form = {
      session_id: 'new_session',
      user_id: 'newuser',
      day_of_week: 'Wednesday',
      duration_sec: 600,
      avg_latency_ms: 20
    };
    apiSpy.createSession.and.returnValue(of({}));
    spyOn(component, 'loadSessions');
    spyOn(component, 'closeModal');

    component.saveSession();

    expect(apiSpy.createSession).toHaveBeenCalled();
    expect(toastSpy.success).toHaveBeenCalledWith('Session created');
    expect(component.closeModal).toHaveBeenCalled();
    expect(component.loadSessions).toHaveBeenCalled();
  });

  it('should update existing session', () => {
    component.isEditing = true;
    component.selectedSession = { _id: '1' };
    component.form = {
      session_id: 'updated_session',
      user_id: 'updateduser',
      day_of_week: 'Thursday',
      duration_sec: 700,
      avg_latency_ms: 25
    };
    apiSpy.updateSession.and.returnValue(of({}));
    spyOn(component, 'loadSessions');
    spyOn(component, 'closeModal');

    component.saveSession();

    expect(apiSpy.updateSession).toHaveBeenCalledWith('1', jasmine.any(FormData));
    expect(toastSpy.success).toHaveBeenCalledWith('Session updated');
  });

  it('should show warning for invalid form', () => {
    component.form = { session_id: '', user_id: '', day_of_week: 'Monday', duration_sec: 300, avg_latency_ms: 25 };
    component.saveSession();
    expect(toastSpy.warning).toHaveBeenCalledWith('Session ID and User ID are required');
  });

  it('should handle save error', () => {
    component.form = {
      session_id: 'session',
      user_id: 'user',
      day_of_week: 'Monday',
      duration_sec: 300,
      avg_latency_ms: 25
    };
    apiSpy.createSession.and.returnValue(throwError(() => new Error('Save failed')));

    component.saveSession();

    expect(toastSpy.error).toHaveBeenCalledWith('Operation failed');
    expect(component.saving).toBeFalse();
  });

  it('should delete session with confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    apiSpy.deleteSession.and.returnValue(of({}));
    spyOn(component, 'loadSessions');

    component.deleteSession('1');

    expect(apiSpy.deleteSession).toHaveBeenCalledWith('1');
    expect(toastSpy.success).toHaveBeenCalledWith('Session deleted');
    expect(component.loadSessions).toHaveBeenCalled();
  });

  it('should not delete session without confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    component.deleteSession('1');
    expect(apiSpy.deleteSession).not.toHaveBeenCalled();
  });

  it('should handle delete error', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    apiSpy.deleteSession.and.returnValue(throwError(() => new Error('Delete failed')));

    component.deleteSession('1');

    expect(toastSpy.error).toHaveBeenCalledWith('Delete failed');
  });

  it('should change page', () => {
    spyOn(component, 'loadSessions');
    component.currentPage = 1;
    component.changePage(1);
    expect(component.currentPage).toBe(2);
    expect(component.loadSessions).toHaveBeenCalled();
  });
});