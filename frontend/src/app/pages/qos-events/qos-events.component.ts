import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-qos-events',
    imports: [CommonModule, FormsModule],
    templateUrl: './qos-events.component.html',
    styleUrls: ['./qos-events.component.css']
})
export class QosEventsComponent implements OnInit {
  events: any[] = [];
  filteredEvents: any[] = [];
  loading = true;
  saving = false;
  showModal = false;
  isEditing = false;
  isViewing = false;
  selectedEvent: any = null;
  currentPage = 1;
  searchTerm = '';
  filterQuality = '';
  form = { user_id: '', application_type: 'video_streaming', signal_value_dbm: -50, latency_avg_ms: 20, signal_quality: 'Good' };

  constructor(
    private api: ApiService, 
    private toast: ToastService,
    public auth: AuthService
  ) {}

  ngOnInit() { this.loadEvents(); }

  loadEvents() {
    this.loading = true;
    this.api.getQosEvents(this.currentPage, 20).subscribe({
      next: (data) => { this.events = data; this.filterEvents(); this.loading = false; },
      error: () => { this.loading = false; this.toast.error('Failed to load events'); }
    });
  }

  filterEvents() {
    this.filteredEvents = this.events.filter(e => {
      const matchSearch = !this.searchTerm || e.User_ID?.toLowerCase().includes(this.searchTerm.toLowerCase()) || e.Application_Type?.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchQuality = !this.filterQuality || e.Signal_Strength?.quality === this.filterQuality;
      return matchSearch && matchQuality;
    });
  }

  getQualityClass(quality: string): string {
    const map: Record<string, string> = { Excellent: 'online', Good: 'active', Fair: 'warning', Poor: 'offline' };
    return map[quality] || 'active';
  }

  openModal() { this.showModal = true; this.isEditing = false; this.isViewing = false; this.resetForm(); }
  closeModal() { this.showModal = false; this.selectedEvent = null; }
  viewEvent(event: any) { this.selectedEvent = event; this.isViewing = true; this.isEditing = false; this.showModal = true; }

  editEvent(event: any) {
    this.selectedEvent = event;
    this.isEditing = true;
    this.isViewing = false;
    this.form = {
      user_id: event.User_ID || '', application_type: event.Application_Type || 'video_streaming',
      signal_value_dbm: event.Signal_Strength?.value_dbm || -50, latency_avg_ms: event.Latency?.avg_ms || 20, signal_quality: event.Signal_Strength?.quality || 'Good'
    };
    this.showModal = true;
  }

  resetForm() { this.form = { user_id: '', application_type: 'video_streaming', signal_value_dbm: -50, latency_avg_ms: 20, signal_quality: 'Good' }; }

  saveEvent() {
    if (!this.form.user_id || !this.form.application_type) { this.toast.warning('User ID and App Type are required'); return; }
    this.saving = true;
    const formData = new FormData();
    Object.entries(this.form).forEach(([key, value]) => formData.append(key, String(value)));

    const request = this.isEditing ? this.api.updateQosEvent(this.selectedEvent._id, formData) : this.api.createQosEvent(formData);
    request.subscribe({
      next: () => { this.toast.success(this.isEditing ? 'Event updated' : 'Event created'); this.closeModal(); this.loadEvents(); this.saving = false; },
      error: () => { this.toast.error('Operation failed'); this.saving = false; }
    });
  }

  deleteEvent(id: string) {
    if (confirm('Delete this event?')) {
      this.api.deleteQosEvent(id).subscribe({
        next: () => { this.toast.success('Event deleted'); this.loadEvents(); },
        error: () => this.toast.error('Delete failed')
      });
    }
  }

  changePage(delta: number) { this.currentPage += delta; this.loadEvents(); }
}
