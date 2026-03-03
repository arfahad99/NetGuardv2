import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { NetworkHealthGraphComponent } from '../../components/network-health-graph/network-health-graph.component';
import { ProbeService, Measurement } from '../../services/probe.service';

@Component({
  selector: 'app-network-health',
  imports: [CommonModule, FormsModule, NetworkHealthGraphComponent],
  templateUrl: './network-health.component.html',
  styleUrls: ['./network-health.component.css']
})
export class NetworkHealthComponent implements OnInit, OnDestroy {
  // --- Probe / Measurement data ---
  latest: Measurement | null = null;
  history: Measurement[] = [];
  allDeviceIds: string[] = [];
  deviceId = 'home-probe-01';
  range = '24h';
  loadingMeasurements = true;
  private refreshTimer: any;

  // Computed stats from history
  avgLatency = 0;
  avgDownload = 0;
  avgUpload = 0;
  avgPacketLoss = 0;
  uptimePercent = 0;
  totalMeasurements = 0;

  // --- Legacy Network Health CRUD ---
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

  // Tab control
  activeTab: 'measurements' | 'records' = 'measurements';

  constructor(
    private api: ApiService,
    private toast: ToastService,
    public auth: AuthService,
    private probe: ProbeService
  ) { }

  ngOnInit() {
    this.loadDeviceList();
    this.loadMeasurements();
    this.loadRecords();
    // Auto-refresh every 60s
    this.refreshTimer = setInterval(() => this.loadMeasurements(), 60_000);
  }

  ngOnDestroy(): void {
    clearInterval(this.refreshTimer);
  }

  // ── Device list from probe ──────────────────────────────────
  loadDeviceList(): void {
    this.probe.getDevices().subscribe({
      next: res => {
        this.allDeviceIds = res.devices || [];
        if (this.allDeviceIds.length > 0 && !this.allDeviceIds.includes(this.deviceId)) {
          this.deviceId = this.allDeviceIds[0];
        }
      },
      error: () => { /* silent — keep default */ }
    });
  }

  // ── Load probe latest + history ─────────────────────────────
  loadMeasurements(): void {
    this.loadingMeasurements = true;

    // Latest
    this.probe.getLatest(this.deviceId).subscribe({
      next: m => this.latest = m,
      error: () => { /* silent */ }
    });

    // History
    const now = new Date();
    const start = new Date(now);
    if (this.range === '1h') start.setHours(now.getHours() - 1);
    else if (this.range === '6h') start.setHours(now.getHours() - 6);
    else if (this.range === '24h') start.setDate(now.getDate() - 1);
    else if (this.range === '7d') start.setDate(now.getDate() - 7);
    else if (this.range === '30d') start.setDate(now.getDate() - 30);

    this.probe.getHistory(
      this.deviceId,
      start.toISOString(),
      now.toISOString()
    ).subscribe({
      next: items => {
        this.history = items;
        this.totalMeasurements = items.length;
        this.computeStats();
        this.loadingMeasurements = false;
      },
      error: () => {
        this.loadingMeasurements = false;
      }
    });
  }

  // ── Compute aggregated stats ────────────────────────────────
  computeStats(): void {
    if (this.history.length === 0) {
      this.avgLatency = 0;
      this.avgDownload = 0;
      this.avgUpload = 0;
      this.avgPacketLoss = 0;
      this.uptimePercent = 0;
      return;
    }

    let totalLat = 0, totalDl = 0, totalUl = 0, totalPl = 0, onlineCount = 0;
    for (const m of this.history) {
      totalLat += Number(m.latencyMs) || 0;
      totalDl += Number(m.downloadMbps) || 0;
      totalUl += Number(m.uploadMbps) || 0;
      totalPl += Number(m.packetLoss) || 0;
      if (m.uptimeStatus === 'online') onlineCount++;
    }
    const n = this.history.length;
    this.avgLatency = Math.round((totalLat / n) * 100) / 100;
    this.avgDownload = Math.round((totalDl / n) * 100) / 100;
    this.avgUpload = Math.round((totalUl / n) * 100) / 100;
    this.avgPacketLoss = Math.round((totalPl / n) * 100) / 100;
    this.uptimePercent = Math.round((onlineCount / n) * 10000) / 100;
  }

  // ── Range / device change ───────────────────────────────────
  onRangeChange(r: string): void {
    this.range = r;
    this.loadMeasurements();
  }

  onDeviceChange(id: string): void {
    this.deviceId = id;
    this.loadMeasurements();
  }

  // ── Alert severity helpers ──────────────────────────────────
  getLatencyClass(): string {
    if (!this.latest) return '';
    if (Number(this.latest.latencyMs) > 100) return 'text-danger';
    if (Number(this.latest.latencyMs) > 50) return 'text-warning';
    return 'text-success';
  }

  getPacketLossClass(): string {
    if (!this.latest) return '';
    if (Number(this.latest.packetLoss) > 5) return 'text-danger';
    if (Number(this.latest.packetLoss) > 1) return 'text-warning';
    return 'text-success';
  }

  getDownloadClass(): string {
    if (!this.latest) return '';
    if (Number(this.latest.downloadMbps) < 10) return 'text-danger';
    if (Number(this.latest.downloadMbps) < 50) return 'text-warning';
    return 'text-success';
  }

  formatTimestamp(ts: string): string {
    if (!ts) return 'N/A';
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  formatDate(ts: string): string {
    if (!ts) return 'N/A';
    const d = new Date(ts);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
      d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // ── Legacy CRUD (kept for backward compat) ──────────────────
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
