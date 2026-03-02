import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-devices',
    imports: [CommonModule, FormsModule],
    templateUrl: './devices.component.html',
    styleUrls: ['./devices.component.css']
})
export class DevicesComponent implements OnInit {
  devices: any[] = [];
  filteredDevices: any[] = [];
  loading = true;
  saving = false;
  showModal = false;
  isEditing = false;
  isViewing = false;
  selectedDevice: any = null;
  currentPage = 1;
  searchTerm = '';
  filterStatus = '';
  filterType = '';
  form = { name: '', type: 'router', primary_ip: '', status_state: 'online', os: '', department: '' };

  constructor(
    private api: ApiService, 
    private toast: ToastService,
    public auth: AuthService
  ) {}

  ngOnInit() { this.loadDevices(); }

  loadDevices() {
    this.loading = true;
    this.api.getDevices(this.currentPage, 20).subscribe({
      next: (data) => { this.devices = data; this.filterDevices(); this.loading = false; },
      error: () => { this.loading = false; this.toast.error('Failed to load devices'); }
    });
  }

  filterDevices() {
    this.filteredDevices = this.devices.filter(d => {
      const matchSearch = !this.searchTerm || d.name?.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchStatus = !this.filterStatus || d.status?.state === this.filterStatus;
      const matchType = !this.filterType || d.type === this.filterType;
      return matchSearch && matchStatus && matchType;
    });
  }

  openModal() { this.showModal = true; this.isEditing = false; this.isViewing = false; this.resetForm(); }
  closeModal() { this.showModal = false; this.selectedDevice = null; }
  
  viewDevice(device: any) { this.selectedDevice = device; this.isViewing = true; this.isEditing = false; this.showModal = true; }
  
  editDevice(device: any) {
    this.selectedDevice = device;
    this.isEditing = true;
    this.isViewing = false;
    this.form = {
      name: device.name || '', type: device.type || 'router', primary_ip: device.network?.primary_ip || '',
      status_state: device.status?.state || 'online', os: device.system?.os || '', department: device.system?.owner?.department || ''
    };
    this.showModal = true;
  }

  resetForm() { this.form = { name: '', type: 'router', primary_ip: '', status_state: 'online', os: '', department: '' }; }

  saveDevice() {
    if (!this.form.name || !this.form.type) { this.toast.warning('Name and Type are required'); return; }
    this.saving = true;
    const formData = new FormData();
    Object.entries(this.form).forEach(([key, value]) => formData.append(key, value));

    const request = this.isEditing ? this.api.updateDevice(this.selectedDevice._id, formData) : this.api.createDevice(formData);
    request.subscribe({
      next: () => { this.toast.success(this.isEditing ? 'Device updated' : 'Device created'); this.closeModal(); this.loadDevices(); this.saving = false; },
      error: () => { this.toast.error('Operation failed'); this.saving = false; }
    });
  }

  deleteDevice(id: string) {
    if (confirm('Are you sure you want to delete this device?')) {
      this.api.deleteDevice(id).subscribe({
        next: () => { this.toast.success('Device deleted'); this.loadDevices(); },
        error: () => this.toast.error('Delete failed')
      });
    }
  }

  changePage(delta: number) { this.currentPage += delta; this.loadDevices(); }
}