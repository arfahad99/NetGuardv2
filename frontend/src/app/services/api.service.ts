import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { BackendHealthService } from './backend-health.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private backendHealth: BackendHealthService
  ) {}

  /**
   * Make HTTP request with backend availability check
   */
  private makeRequest<T>(requestFn: () => Observable<T>): Observable<T> {
    if (!this.backendHealth.isBackendAvailable()) {
      return throwError(() => new Error('Backend server is not available. Please ensure the backend is running.'));
    }

    return requestFn().pipe(
      catchError((error: HttpErrorResponse) => {
        // If we get a connection error, trigger a health check
        if (error.status === 0 || error.status >= 500) {
          this.backendHealth.forceHealthCheck().subscribe();
        }
        return throwError(() => error);
      })
    );
  }

  getDevices(page?: number, limit?: number): Observable<any> {
    return this.makeRequest(() => {
      let url = `${this.apiUrl}/devices`;
      if (page !== undefined && limit !== undefined) {
        url += `?pn=${page}&ps=${limit}`;
      }
      return this.http.get(url);
    });
  }

  getAlerts(page?: number, limit?: number): Observable<any> {
    return this.makeRequest(() => {
      let url = `${this.apiUrl}/alerts`;
      if (page !== undefined && limit !== undefined) {
        url += `?pn=${page}&ps=${limit}`;
      }
      return this.http.get(url);
    });
  }

  getSessions(page?: number, limit?: number): Observable<any> {
    return this.makeRequest(() => {
      let url = `${this.apiUrl}/sessions`;
      if (page !== undefined && limit !== undefined) {
        url += `?pn=${page}&ps=${limit}`;
      }
      return this.http.get(url);
    });
  }

  getQosEvents(page?: number, limit?: number): Observable<any> {
    return this.makeRequest(() => {
      let url = `${this.apiUrl}/qos-events`;
      if (page !== undefined && limit !== undefined) {
        url += `?pn=${page}&ps=${limit}`;
      }
      return this.http.get(url);
    });
  }

  getNetworkHealth(page?: number, limit?: number): Observable<any> {
    return this.makeRequest(() => {
      let url = `${this.apiUrl}/network-health`;
      if (page !== undefined && limit !== undefined) {
        url += `?pn=${page}&ps=${limit}`;
      }
      return this.http.get(url);
    });
  }

  acknowledgeAlert(alertId: number): Observable<any> {
    return this.makeRequest(() => 
      this.http.post(`${this.apiUrl}/alerts/${alertId}/acknowledge`, {})
    );
  }

  resolveAlert(alertId: number): Observable<any> {
    return this.makeRequest(() => 
      this.http.post(`${this.apiUrl}/alerts/${alertId}/resolve`, {})
    );
  }

  createDevice(data: any): Observable<any> {
    return this.makeRequest(() => 
      this.http.post(`${this.apiUrl}/devices`, data)
    );
  }

  updateDevice(id: string, data: any): Observable<any> {
    return this.makeRequest(() => 
      this.http.put(`${this.apiUrl}/devices/${id}`, data)
    );
  }

  deleteDevice(id: string): Observable<any> {
    return this.makeRequest(() => 
      this.http.delete(`${this.apiUrl}/devices/${id}`)
    );
  }

  createAlert(data: any): Observable<any> {
    return this.makeRequest(() => 
      this.http.post(`${this.apiUrl}/alerts`, data)
    );
  }

  updateAlert(id: string, data: any): Observable<any> {
    return this.makeRequest(() => 
      this.http.put(`${this.apiUrl}/alerts/${id}`, data)
    );
  }

  deleteAlert(id: string): Observable<any> {
    return this.makeRequest(() => 
      this.http.delete(`${this.apiUrl}/alerts/${id}`)
    );
  }

  createSession(data: any): Observable<any> {
    return this.makeRequest(() => 
      this.http.post(`${this.apiUrl}/sessions`, data)
    );
  }

  updateSession(id: string, data: any): Observable<any> {
    return this.makeRequest(() => 
      this.http.put(`${this.apiUrl}/sessions/${id}`, data)
    );
  }

  deleteSession(id: string): Observable<any> {
    return this.makeRequest(() => 
      this.http.delete(`${this.apiUrl}/sessions/${id}`)
    );
  }

  createQosEvent(data: any): Observable<any> {
    return this.makeRequest(() => 
      this.http.post(`${this.apiUrl}/qos-events`, data)
    );
  }

  updateQosEvent(id: string, data: any): Observable<any> {
    return this.makeRequest(() => 
      this.http.put(`${this.apiUrl}/qos-events/${id}`, data)
    );
  }

  deleteQosEvent(id: string): Observable<any> {
    return this.makeRequest(() => 
      this.http.delete(`${this.apiUrl}/qos-events/${id}`)
    );
  }

  createNetworkHealth(data: any): Observable<any> {
    return this.makeRequest(() => 
      this.http.post(`${this.apiUrl}/network-health`, data)
    );
  }

  updateNetworkHealth(id: string, data: any): Observable<any> {
    return this.makeRequest(() => 
      this.http.put(`${this.apiUrl}/network-health/${id}`, data)
    );
  }

  deleteNetworkHealth(id: string): Observable<any> {
    return this.makeRequest(() => 
      this.http.delete(`${this.apiUrl}/network-health/${id}`)
    );
  }

  // User Management Methods (Admin only)
  getUsers(page?: number, limit?: number): Observable<any> {
    return this.makeRequest(() => {
      let url = `${this.apiUrl}/users`;
      if (page !== undefined && limit !== undefined) {
        url += `?pn=${page}&ps=${limit}`;
      }
      return this.http.get(url);
    });
  }

  getUser(id: string): Observable<any> {
    return this.makeRequest(() => 
      this.http.get(`${this.apiUrl}/users/${id}`)
    );
  }

  createUser(data: any): Observable<any> {
    return this.makeRequest(() => 
      this.http.post(`${this.apiUrl}/users`, data)
    );
  }

  updateUser(id: string, data: any): Observable<any> {
    return this.makeRequest(() => 
      this.http.put(`${this.apiUrl}/users/${id}`, data)
    );
  }

  deleteUser(id: string): Observable<any> {
    return this.makeRequest(() => 
      this.http.delete(`${this.apiUrl}/users/${id}`)
    );
  }
}
