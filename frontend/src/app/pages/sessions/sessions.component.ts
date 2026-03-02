import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-sessions',
    imports: [CommonModule, FormsModule],
    templateUrl: './sessions.component.html',
    styleUrls: ['./sessions.component.css']
})
export class SessionsComponent implements OnInit {
  sessions: any[] = [];
  filteredSessions: any[] = [];
  loading = true;
  saving = false;
  showModal = false;
  isEditing = false;
  isViewing = false;
  selectedSession: any = null;
  currentPage = 1;
  searchTerm = '';
  filterDay = '';
  filterPeak = '';
  form = { session_id: '', user_id: '', day_of_week: 'Monday', duration_sec: 300, avg_latency_ms: 25 };

  constructor(
    private api: ApiService, 
    private toast: ToastService,
    public auth: AuthService
  ) {}

  ngOnInit() { this.loadSessions(); }

  loadSessions() {
    this.loading = true;
    this.api.getSessions(this.currentPage, 20).subscribe({
      next: (data) => { this.sessions = data; this.filterSessions(); this.loading = false; },
      error: () => { this.loading = false; this.toast.error('Failed to load sessions'); }
    });
  }

  filterSessions() {
    this.filteredSessions = this.sessions.filter(s => {
      const matchSearch = !this.searchTerm || s.session_id?.toLowerCase().includes(this.searchTerm.toLowerCase()) || s.user_ref?.user_id?.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchDay = !this.filterDay || s.context?.temporal?.day_of_week === this.filterDay;
      const matchPeak = !this.filterPeak || String(s.context?.temporal?.is_peak_hour) === this.filterPeak;
      return matchSearch && matchDay && matchPeak;
    });
  }

  openModal() { this.showModal = true; this.isEditing = false; this.isViewing = false; this.resetForm(); }
  closeModal() { this.showModal = false; this.selectedSession = null; }
  viewSession(session: any) { this.selectedSession = session; this.isViewing = true; this.isEditing = false; this.showModal = true; }

  editSession(session: any) {
    this.selectedSession = session;
    this.isEditing = true;
    this.isViewing = false;
    this.form = {
      session_id: session.session_id || '', user_id: session.user_ref?.user_id || '',
      day_of_week: session.context?.temporal?.day_of_week || 'Monday',
      duration_sec: session.metrics_summary?.duration_sec || 300, avg_latency_ms: session.metrics_summary?.avg_latency_ms || 25
    };
    this.showModal = true;
  }

  resetForm() { this.form = { session_id: '', user_id: '', day_of_week: 'Monday', duration_sec: 300, avg_latency_ms: 25 }; }

  saveSession() {
    if (!this.form.session_id || !this.form.user_id) { this.toast.warning('Session ID and User ID are required'); return; }
    this.saving = true;
    const formData = new FormData();
    Object.entries(this.form).forEach(([key, value]) => formData.append(key, String(value)));

    const request = this.isEditing ? this.api.updateSession(this.selectedSession._id, formData) : this.api.createSession(formData);
    request.subscribe({
      next: () => { this.toast.success(this.isEditing ? 'Session updated' : 'Session created'); this.closeModal(); this.loadSessions(); this.saving = false; },
      error: () => { this.toast.error('Operation failed'); this.saving = false; }
    });
  }

  deleteSession(id: string) {
    if (confirm('Delete this session?')) {
      this.api.deleteSession(id).subscribe({
        next: () => { this.toast.success('Session deleted'); this.loadSessions(); },
        error: () => this.toast.error('Delete failed')
      });
    }
  }

  changePage(delta: number) { this.currentPage += delta; this.loadSessions(); }
}
