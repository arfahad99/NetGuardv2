import { Component, OnInit, OnDestroy } from '@angular/core';
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
export class HomeComponent implements OnInit, OnDestroy {
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

  private refreshInterval: any;

  ngOnInit() {
    this.loadData();
    this.refreshInterval = setInterval(() => {
      this.loadData(true);
    }, 30000); // 30 seconds refresh
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
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
  loadData(isRefresh = false) {
    if (!isRefresh) {
      this.loading = true;
    }
    forkJoin({
      devices: this.api.getDevices(),
      alerts: this.api.getAlerts(),
      networkHealth: this.api.getNetworkHealth(),
      sessions: this.api.getSessions()
    }).subscribe({
      next: (data) => {
        // Slice the arrays for the UI display, leaving the full arrays for stats
        this.recentDevices = data.devices.slice(0, 5);
        this.recentAlerts = data.alerts.slice(0, 5);
        this.networkHealthData = data.networkHealth.slice(0, 20);
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
