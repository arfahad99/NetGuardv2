import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { BackendHealthService } from '../../services/backend-health.service';

@Component({
  selector: 'app-backend-status',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './backend-status.component.html',
  styleUrls: ['./backend-status.component.css']
})
export class BackendStatusComponent implements OnInit, OnDestroy {
  isBackendAvailable = false;
  isRetrying = false;
  showInstructions = false;
  lastCheckTime = new Date();
  serverUrl = '';
  
  private subscription?: Subscription;

  constructor(private backendHealth: BackendHealthService) {
    this.serverUrl = 'http://127.0.0.1:5001'; // From environment
  }

  ngOnInit() {
    // Subscribe to backend status changes
    this.subscription = this.backendHealth.backendStatus$.subscribe(status => {
      this.isBackendAvailable = status;
      this.lastCheckTime = new Date();
    });

    // Force initial check
    this.retryConnection();
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  retryConnection() {
    this.isRetrying = true;
    this.backendHealth.forceHealthCheck().subscribe({
      next: (status) => {
        this.isRetrying = false;
        this.isBackendAvailable = status;
      },
      error: () => {
        this.isRetrying = false;
      }
    });
  }
}