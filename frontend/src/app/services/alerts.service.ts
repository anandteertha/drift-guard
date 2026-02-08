import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Alert {
  alert_id: string;
  project_id: string;
  baseline_version: number;
  created_at: string;
  severity: string;
  alert_type: string;
  feature_name: string | null;
  metric_value: number | null;
  message: string;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class AlertsService {
  private apiUrl = 'http://127.0.0.1:8080/api';

  constructor(private http: HttpClient) {}

  listAlerts(projectId: string, status?: string, severity?: string): Observable<Alert[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    if (severity) {
      params = params.set('severity', severity);
    }
    return this.http.get<Alert[]>(
      `${this.apiUrl}/projects/${projectId}/alerts`,
      { params }
    );
  }

  ackAlert(projectId: string, alertId: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/projects/${projectId}/alerts/${alertId}/ack`,
      {}
    );
  }
}

