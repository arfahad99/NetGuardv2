import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { NetworkHealthGraphComponent } from '../../components/network-health-graph/network-health-graph.component';

@Component({
    selector: 'app-network-health',
    imports: [CommonModule, FormsModule, NetworkHealthGraphComponent],
    templateUrl: './network-health.component.html',
    styleUrls: ['./network-health.component.css']
})
export class NetworkHealthComponent implements OnInit {
  records: any[] = [];
  filteredRecords: any[] = [];
  uniqueSites: string[] = [];
  loading = true;
  saving = false;
  showModal = false;
  isEditing = false;
  isViewing = false;
  selectedRecord: any = null;
  currentPage = 1;
  searchTerm = '';
  filterSite = '';
  Math = Math;
  form = { site: '', interface: '', upload_mbps: 0, download_mbps: 0, latency_ms: 0, packet_loss_percent: 0, uptime_percent: 99 };

  constructor(
    private api: ApiService, 
    private toast: ToastService,
    public auth: AuthService
  ) {}

  ngOnInit() { this.loadRecords(); }

  loadRecords() {
    this.loading = true;
    this.api.getNetworkHealth(this.currentPage, 20).subscribe({
      next: (data) => {
        this.records = data;
        this.uniqueSites = [...new Set(data.map((r: any) => r.context?.site).filter(Boolean))] as string[];
        this.filterRecords();
        this.loading = false;
      },
      error: () => { this.loading = false; this.toast.error('Failed to load records'); }
    });
  }

  filterRecords() {
    this.filteredRecords = this.records.filter(r => {
      const matchSearch = !this.searchTerm || r.context?.site?.toLowerCase().includes(this.searchTerm.toLowerCase()) || r.context?.interface?.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchSite = !this.filterSite || r.context?.site === this.filterSite;
      return matchSearch && matchSite;
    });
  }

  getUptimeClass(uptime: number): string {
    if (uptime >= 99) return 'online';
    if (uptime >= 95) return 'warning';
    return 'offline';
  }

  openModal() { this.showModal = true; this.isEditing = false; this.isViewing = false; this.resetForm(); }
  closeModal() { this.showModal = false; this.selectedRecord = null; }
  viewRecord(record: any) { this.selectedRecord = record; this.isViewing = true; this.isEditing = false; this.showModal = true; }

  editRecord(record: any) {
    this.selectedRecord = record;
    this.isEditing = true;
    this.isViewing = false;
    this.form = {
      site: record.context?.site || '', interface: record.context?.interface || '',
      upload_mbps: record.metrics?.bandwidth?.upload_mbps || 0, download_mbps: record.metrics?.bandwidth?.download_mbps || 0,
      latency_ms: record.metrics?.latency_ms || 0, packet_loss_percent: record.metrics?.packet_loss_percent || 0, uptime_percent: record.metrics?.uptime_percent || 99
    };
    this.showModal = true;
  }

  resetForm() { this.form = { site: '', interface: '', upload_mbps: 0, download_mbps: 0, latency_ms: 0, packet_loss_percent: 0, uptime_percent: 99 }; }

  saveRecord() {
    if (!this.form.site || !this.form.interface) { this.toast.warning('Site and Interface are required'); return; }
    this.saving = true;
    const formData = new FormData();
    Object.entries(this.form).forEach(([key, value]) => formData.append(key, String(value)));

    const request = this.isEditing ? this.api.updateNetworkHealth(this.selectedRecord._id, formData) : this.api.createNetworkHealth(formData);
    request.subscribe({
      next: () => { this.toast.success(this.isEditing ? 'Record updated' : 'Record created'); this.closeModal(); this.loadRecords(); this.saving = false; },
      error: () => { this.toast.error('Operation failed'); this.saving = false; }
    });
  }

  deleteRecord(id: string) {
    if (confirm('Delete this record?')) {
      this.api.deleteNetworkHealth(id).subscribe({
        next: () => { this.toast.success('Record deleted'); this.loadRecords(); },
        error: () => this.toast.error('Delete failed')
      });
    }
  }

  changePage(delta: number) { this.currentPage += delta; this.loadRecords(); }
}
