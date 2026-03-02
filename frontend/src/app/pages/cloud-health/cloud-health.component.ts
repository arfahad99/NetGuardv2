import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { interval, Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface ServiceStatus {
    name: string;
    icon: string;
    status: 'online' | 'offline' | 'checking';
    message: string;
    lastChecked: Date | null;
    responseTime?: number;
}

@Component({
    selector: 'app-cloud-health',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './cloud-health.component.html',
    styleUrls: ['./cloud-health.component.css']
})
export class CloudHealthComponent implements OnInit, OnDestroy {
    services: ServiceStatus[] = [];
    overallStatus: 'healthy' | 'degraded' | 'down' = 'checking' as any;
    uptimePercent = 100;
    totalChecks = 0;
    successfulChecks = 0;
    private destroy$ = new Subject<void>();
    private refreshSub?: Subscription;

    constructor(private http: HttpClient) { }

    ngOnInit() {
        this.services = [
            { name: 'Flask Backend', icon: 'bi-server', status: 'checking', message: 'Checking...', lastChecked: null },
            { name: 'DynamoDB', icon: 'bi-database-fill', status: 'checking', message: 'Checking...', lastChecked: null },
            { name: 'Angular Frontend', icon: 'bi-window-fullscreen', status: 'online', message: 'Running', lastChecked: new Date() },
            { name: 'Network Probe', icon: 'bi-broadcast-pin', status: 'checking', message: 'Checking...', lastChecked: null }
        ];

        this.checkAllServices();

        // Refresh every 30 seconds
        this.refreshSub = interval(30000).pipe(takeUntil(this.destroy$)).subscribe(() => {
            this.checkAllServices();
        });
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    checkAllServices() {
        this.checkBackend();
        this.checkProbeStatus();
    }

    private checkBackend() {
        const startTime = Date.now();
        this.services[0].status = 'checking';

        this.http.get<any>(`${environment.apiUrl}/health`).subscribe({
            next: (res) => {
                const responseTime = Date.now() - startTime;
                this.services[0] = {
                    ...this.services[0],
                    status: 'online',
                    message: `Healthy (${responseTime}ms)`,
                    lastChecked: new Date(),
                    responseTime
                };
                // DynamoDB is connected if backend is healthy
                this.services[1] = {
                    ...this.services[1],
                    status: 'online',
                    message: 'Connected via Backend',
                    lastChecked: new Date()
                };
                this.totalChecks++;
                this.successfulChecks++;
                this.updateOverallStatus();
            },
            error: () => {
                this.services[0] = {
                    ...this.services[0],
                    status: 'offline',
                    message: 'Unreachable',
                    lastChecked: new Date()
                };
                this.services[1] = {
                    ...this.services[1],
                    status: 'offline',
                    message: 'Cannot verify',
                    lastChecked: new Date()
                };
                this.totalChecks++;
                this.updateOverallStatus();
            }
        });
    }

    private checkProbeStatus() {
        this.http.get<any>(`${environment.apiUrl}/probe/status/home-probe-01`, {
            headers: { 'x-api-key': environment.probeApiKey }
        }).subscribe({
            next: (res) => {
                const online = res?.online;
                this.services[3] = {
                    ...this.services[3],
                    status: online ? 'online' : 'offline',
                    message: online ? `Active — Last seen: ${res.lastSeen}` : `Offline — Last seen: ${res.lastSeen || 'never'}`,
                    lastChecked: new Date()
                };
                this.updateOverallStatus();
            },
            error: () => {
                this.services[3] = {
                    ...this.services[3],
                    status: 'offline',
                    message: 'No data yet',
                    lastChecked: new Date()
                };
                this.updateOverallStatus();
            }
        });
    }

    private updateOverallStatus() {
        const statuses = this.services.map(s => s.status);
        if (statuses.every(s => s === 'online')) {
            this.overallStatus = 'healthy';
        } else if (statuses.every(s => s === 'offline')) {
            this.overallStatus = 'down';
        } else {
            this.overallStatus = 'degraded';
        }
        this.uptimePercent = this.totalChecks > 0
            ? Math.round((this.successfulChecks / this.totalChecks) * 100)
            : 100;
    }

    refreshAll() {
        this.checkAllServices();
    }

    getStatusClass(status: string): string {
        return status;
    }

    getOverallIcon(): string {
        switch (this.overallStatus) {
            case 'healthy': return 'bi-cloud-check-fill';
            case 'degraded': return 'bi-cloud-haze-fill';
            case 'down': return 'bi-cloud-slash-fill';
            default: return 'bi-cloud-fill';
        }
    }
}
