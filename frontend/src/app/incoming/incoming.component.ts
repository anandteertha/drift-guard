import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { IncomingService, UploadIncomingResponse } from '../services/incoming.service';

@Component({
  selector: 'app-incoming',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatChipsModule
  ],
  template: `
    <div>
      <button mat-button (click)="goBack()">
        <mat-icon>arrow_back</mat-icon>
        Back to Projects
      </button>
      
      <h1>Incoming Data Upload</h1>
      
      <mat-card style="margin-bottom: 20px;">
        <mat-card-header>
          <mat-card-title>Upload Incoming CSV</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <input type="file" accept=".csv" (change)="onFileSelected($event)" #fileInput style="display: none;">
          <button mat-raised-button color="primary" (click)="fileInput.click()">
            <mat-icon>upload</mat-icon>
            Select CSV File
          </button>
          <span *ngIf="selectedFile" style="margin-left: 10px;">{{ selectedFile.name }}</span>
          <br><br>
          <button mat-raised-button color="accent" (click)="uploadIncoming()" [disabled]="!selectedFile || uploading">
            <mat-icon>cloud_upload</mat-icon>
            Upload & Analyze
          </button>
          <mat-progress-bar *ngIf="uploading" mode="indeterminate"></mat-progress-bar>
        </mat-card-content>
      </mat-card>

      <mat-card *ngIf="uploadResult">
        <mat-card-header>
          <mat-card-title>Upload Results</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p><strong>Rows Processed:</strong> {{ uploadResult.rows_processed }}</p>
          <p><strong>Alerts Created:</strong> {{ uploadResult.alerts_created }}</p>
          <p><strong>Health Status:</strong> 
            <mat-chip [color]="getHealthColor(uploadResult.health)">
              {{ uploadResult.health }}
            </mat-chip>
          </p>
          <button mat-raised-button color="primary" [routerLink]="['/projects', projectId, 'alerts']" style="margin-top: 10px;">
            <mat-icon>notifications</mat-icon>
            View Alerts
          </button>
        </mat-card-content>
      </mat-card>
    </div>
  `
})
export class IncomingComponent implements OnInit {
  projectId = '';
  selectedFile: File | null = null;
  uploading = false;
  uploadResult: UploadIncomingResponse | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private incomingService: IncomingService
  ) {}

  ngOnInit() {
    this.projectId = this.route.snapshot.paramMap.get('id') || '';
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    this.uploadResult = null;
  }

  uploadIncoming() {
    if (!this.selectedFile || !this.projectId) {
      return;
    }

    this.uploading = true;
    this.incomingService.uploadIncoming(this.projectId, this.selectedFile).subscribe({
      next: (result) => {
        this.uploading = false;
        this.uploadResult = result;
        this.selectedFile = null;
      },
      error: (err) => {
        this.uploading = false;
        console.error('Failed to upload incoming data:', err);
        alert('Failed to upload incoming data: ' + (err.error?.error || err.message));
      }
    });
  }

  getHealthColor(health: string): 'primary' | 'accent' | 'warn' {
    if (health === 'OK') return 'primary';
    if (health === 'WARN') return 'accent';
    return 'warn';
  }

  goBack() {
    this.router.navigate(['/projects']);
  }
}

