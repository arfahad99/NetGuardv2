import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, timer, of, Subscription } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BackendHealthService {
  private healthCheckUrl = `${environment.apiUrl}/health`;
  private backendStatusSubject = new BehaviorSubject<boolean>(false);
  private lastCheckTime = 0;
  private checkInterval = 5000; // Check every 5 seconds
  private isChecking = false;
  private subscription?: Subscription;

  public backendStatus$ = this.backendStatusSubject.asObservable();

  constructor(private http: HttpClient) {
    this.startHealthCheck();
  }

  /**
   * Clean up resources when service is destroyed
   */
  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.backendStatusSubject.complete();
  }

  /**
   * Start continuous health checking
   */
  private startHealthCheck(): void {
    this.subscription = timer(0, this.checkInterval).pipe(
      switchMap(() => this.checkBackendHealth())
    ).subscribe();
  }

  /**
   * Check if backend is available
   */
  checkBackendHealth(): Observable<boolean> {
    if (this.isChecking) {
      return of(this.backendStatusSubject.value);
    }

    this.isChecking = true;
    this.lastCheckTime = Date.now();

    return this.http.get(this.healthCheckUrl, {
      timeout: 3000,
      observe: 'response'
    }).pipe(
      map(response => {
        const isHealthy = response.status === 200;
        this.updateBackendStatus(isHealthy);
        this.isChecking = false;
        return isHealthy;
      }),
      catchError((error: HttpErrorResponse) => {
        console.warn('Backend health check failed:', error.message);
        this.updateBackendStatus(false);
        this.isChecking = false;
        return of(false);
      })
    );
  }

  /**
   * Update backend status and notify subscribers
   */
  private updateBackendStatus(isHealthy: boolean): void {
    if (this.backendStatusSubject.value !== isHealthy) {
      this.backendStatusSubject.next(isHealthy);

      if (isHealthy) {
        console.log('✅ Backend is now available');
      } else {
        console.error('❌ Backend is not available');
      }
    }
  }

  /**
   * Get current backend status
   */
  isBackendAvailable(): boolean {
    return this.backendStatusSubject.value;
  }

  /**
   * Force a health check
   */
  forceHealthCheck(): Observable<boolean> {
    return this.checkBackendHealth();
  }

  /**
   * Get time since last check
   */
  getTimeSinceLastCheck(): number {
    return Date.now() - this.lastCheckTime;
  }
}