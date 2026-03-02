import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';
import { forkJoin } from 'rxjs';
import { TextFlipComponent } from '../components/text-flip/text-flip.component';
import { NetworkHealthGraphComponent } from '../components/network-health-graph/network-health-graph.component';
import { StatusBadgeComponent } from '../components/status-badge/status-badge.component';

/**
 * Dashboard Component (Home)
 * 
 * Main dashboard displaying overview of network monitoring system.
 * 
 * Features:
 * - Real-time statistics cards (Devices, Alerts, Network Health, Sessions)
 * - Network health graphs (Bandwidth, Latency, Uptime, Packet Loss)
 * - Recent alerts list
 * - Recent devices list
 * - Live clock display
 * - Animated text flip effect
 * 
 * Route: /dashboard
 * 
 * Note: This component loads data from multiple endpoints using forkJoin
 * for parallel API calls to improve performance.
 */
@Component({
    selector: 'app-home',
    imports: [CommonModule, RouterLink, TextFlipComponent, NetworkHealthGraphComponent, StatusBadgeComponent],
    templateUrl: './home.html',
    styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit {
  /** Statistics summary for dashboard cards */
  stats = { devices: 0, alerts: 0, networkHealth: 0, sessions: 0 };
  
  /** Recent alerts (limited to 5) */
  recentAlerts: any[] = [];
  
  /** Recent devices (limited to 5) */
  recentDevices: any[] = [];
  
  /** Network health data for graphs (20 records) */
  networkHealthData: any[] = [];
  
  /** Loading state for initial data fetch */
  loading = true;
  
  /** Current time string updated every second */
  currentTime = '';

  constructor(private api: ApiService) {
    this.updateTime();
    // Update time display every second
    setInterval(() => this.updateTime(), 1000);
  }

  ngOnInit() {
    this.loadData();
  }

  /**
   * Updates the current time display
   * Called every second by setInterval
   */
  updateTime() {
    this.currentTime = new Date().toLocaleString();
  }

  /**
   * Loads all dashboard data in parallel using forkJoin
   * Fetches devices, alerts, network health, and sessions simultaneously
   */
  loadData() {
    forkJoin({
      devices: this.api.getDevices(1, 5),
      alerts: this.api.getAlerts(1, 5),
      networkHealth: this.api.getNetworkHealth(1, 20),
      sessions: this.api.getSessions(1, 5)
    }).subscribe({
      next: (data) => {
        this.recentDevices = data.devices;
        this.recentAlerts = data.alerts;
        this.networkHealthData = data.networkHealth;
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
