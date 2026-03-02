import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Measurement {
    deviceId: string;
    timestamp: string;
    latencyMs: number;
    packetLoss: number;
    downloadMbps: number;
    uploadMbps: number;
    uptimeStatus: string;
    alertFlag?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProbeService {

    private base = environment.apiUrl + '/probe';

    // The probe API uses x-api-key, NOT the user's JWT
    private headers = new HttpHeaders({
        'x-api-key': environment.probeApiKey
    });

    constructor(private http: HttpClient) { }

    getLatest(deviceId: string): Observable<Measurement> {
        return this.http.get<Measurement>(
            `${this.base}/latest/${deviceId}`, { headers: this.headers }
        );
    }

    getHistory(deviceId: string, start: string, end: string): Observable<Measurement[]> {
        return this.http.get<Measurement[]>(
            `${this.base}/history/${deviceId}?start=${start}&end=${end}`,
            { headers: this.headers }
        );
    }

    getDevices(): Observable<{ devices: string[] }> {
        return this.http.get<{ devices: string[] }>(
            `${this.base}/devices`, { headers: this.headers }
        );
    }

    getStatus(deviceId: string): Observable<any> {
        return this.http.get<any>(
            `${this.base}/status/${deviceId}`, { headers: this.headers }
        );
    }
}
