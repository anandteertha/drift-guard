import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FeatureMetadata {
  name: string;
  feature_type: string;
  metadata: any;
}

export interface BaselineMetadata {
  baseline_version: number;
  prediction_rate: number;
  created_at: string;
  features: FeatureMetadata[];
}

export interface BaselineUploadResponse {
  baseline_version: number;
  prediction_rate: number;
  features: FeatureMetadata[];
}

@Injectable({
  providedIn: 'root'
})
export class BaselineService {
  private apiUrl = 'http://127.0.0.1:8080/api';

  constructor(private http: HttpClient) {}

  uploadBaseline(projectId: string, file: File): Observable<BaselineUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<BaselineUploadResponse>(
      `${this.apiUrl}/projects/${projectId}/baseline/upload`,
      formData
    );
  }

  getBaseline(projectId: string): Observable<BaselineMetadata> {
    return this.http.get<BaselineMetadata>(
      `${this.apiUrl}/projects/${projectId}/baseline`
    );
  }
}

