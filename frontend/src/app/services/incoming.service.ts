import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UploadIncomingResponse {
  rows_processed: number;
  alerts_created: number;
  health: string;
}

@Injectable({
  providedIn: 'root'
})
export class IncomingService {
  private apiUrl = 'http://127.0.0.1:8080/api';

  constructor(private http: HttpClient) {}

  uploadIncoming(projectId: string, file: File): Observable<UploadIncomingResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UploadIncomingResponse>(
      `${this.apiUrl}/projects/${projectId}/incoming/upload`,
      formData
    );
  }
}

