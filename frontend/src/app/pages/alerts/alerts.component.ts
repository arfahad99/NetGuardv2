import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';

@Component({
    selector: 'app-alerts',
    imports: [CommonModule, FormsModule, StatusBadgeComponent],
    templateUrl: './alerts.component.html',
    styleUrls: ['./alerts.component.css']
})
export class AlertsComponent implements OnInit {
  alerts: any[] = [];
  filteredAlerts: any[] = [];
  loading = true;
  saving = false;
  showModal = false;
  isEditing = false;
  isViewing = false;
  selectedAlert: any = null;
  currentPage = 1;
  searchTerm = '';
  filterSeverity = '';
  filterAlertStatus = '';
  form = { type: '', severity: 'medium', message: '', status: 'active', interface: 'eth0', device_id: '1' };

  constructor(
    private api: ApiService, 
    private toast: ToastService,
    public auth: AuthService
  ) {}

  ngOnInit() { this.loadAlerts(); }

  loadAlerts() {
    this.loading = true;
    this.api.getAlerts(this.currentPage, 20).subscribe({
      next: (data) => { this.alerts = data; this.filterAlerts(); this.loading = false; },
      error: () => { this.loading = false; this.toast.error('Failed to load alerts'); }
    });
  }

  filterAlerts() {
    this.filteredAlerts = this.alerts.filter(a => {
      const matchSearch = !this.searchTerm || a.type?.toLowerCase().includes(this.searchTerm.toLowerCase()) || a.message?.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchSeverity = !this.filterSeverity || a.severity === this.filterSeverity;
      const matchStatus = !this.filterAlertStatus || a.status === this.filterAlertStatus;
      return matchSearch && matchSeverity && matchStatus;
    });
  }

  getSeverityClass(severity: string): string {
    const map: Record<string, string> = { critical: 'critical', high: 'warning', medium: 'active', low: 'online' };
    return map[severity] || 'active';
  }

  openModal() { this.showModal = true; this.isEditing = false; this.isViewing = false; this.resetForm(); }
  closeModal() { this.showModal = false; this.selectedAlert = null; }
  viewAlert(alert: any) { this.selectedAlert = alert; this.isViewing = true; this.isEditing = false; this.showModal = true; }
  
  editAlert(alert: any) {
    this.selectedAlert = alert;
    this.isEditing = true;
    this.isViewing = false;
    this.form = { type: alert.type || '', severity: alert.severity || 'medium', message: alert.message || '', status: alert.status || 'active', interface: alert.device?.interface || 'eth0', device_id: String(alert.device?.device_id || 1) };
    this.showModal = true;
  }

  resetForm() { this.form = { type: '', severity: 'medium', message: '', status: 'active', interface: 'eth0', device_id: '1' }; }

  saveAlert() {
    if (!this.form.type || !this.form.severity || !this.form.message) { this.toast.warning('Type, Severity and Message are required'); return; }
    this.saving = true;
    const formData = new FormData();
    Object.entries(this.form).forEach(([key, value]) => formData.append(key, value));

    const request = this.isEditing ? this.api.updateAlert(this.selectedAlert._id, formData) : this.api.createAlert(formData);
    request.subscribe({
      next: () => { this.toast.success(this.isEditing ? 'Alert updated' : 'Alert created'); this.closeModal(); this.loadAlerts(); this.saving = false; },
      error: () => { this.toast.error('Operation failed'); this.saving = false; }
    });
  }

  deleteAlert(id: string) {
    if (confirm('Delete this alert?')) {
      this.api.deleteAlert(id).subscribe({
        next: () => { this.toast.success('Alert deleted'); this.loadAlerts(); },
        error: () => this.toast.error('Delete failed')
      });
    }
  }

  changePage(delta: number) { this.currentPage += delta; this.loadAlerts(); }
}
