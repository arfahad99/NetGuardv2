import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  stats = { devices: 0, alerts: 0, networkHealth: 0, sessions: 0 };
  recentAlerts: any[] = [];
  recentDevices: any[] = [];
  loading = true;
  currentTime = '';
  private timeInterval: any;
  private refreshInterval: any;

  constructor(private api: ApiService) {
    this.updateTime();
    this.timeInterval = setInterval(() => this.updateTime(), 1000);
  }

  ngOnInit() {
    this.loadData();
    this.refreshInterval = setInterval(() => this.loadData(), 30000);
  }

  ngOnDestroy() {
    clearInterval(this.timeInterval);
    clearInterval(this.refreshInterval);
  }

  updateTime() {
    this.currentTime = new Date().toLocaleString();
  }

  loadData() {
    forkJoin({
      devices: this.api.getDevices(1, 5),
      alerts: this.api.getAlerts(1, 5),
      networkHealth: this.api.getNetworkHealth(1, 5),
      sessions: this.api.getSessions(1, 5)
    }).subscribe({
      next: (data) => {
        this.recentDevices = data.devices;
        this.recentAlerts = data.alerts;
        this.stats = {
          devices: data.devices.length,
          alerts: data.alerts.length,
          networkHealth: data.networkHealth.length,
          sessions: data.sessions.length
        };
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }
}

