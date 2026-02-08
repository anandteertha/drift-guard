import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { BaselineService, BaselineMetadata } from '../services/baseline.service';

@Component({
  selector: 'app-baseline',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTableModule
  ],
  template: `
    <div>
      <button mat-button (click)="goBack()">
        <mat-icon>arrow_back</mat-icon>
        Back to Projects
      </button>
      
      <h1>Baseline Upload</h1>
      
      <mat-card style="margin-bottom: 20px;">
        <mat-card-header>
          <mat-card-title>Upload Baseline CSV</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <input type="file" accept=".csv" (change)="onFileSelected($event)" #fileInput style="display: none;">
          <button mat-raised-button color="primary" (click)="fileInput.click()">
            <mat-icon>upload</mat-icon>
            Select CSV File
          </button>
          <span *ngIf="selectedFile" style="margin-left: 10px;">{{ selectedFile.name }}</span>
          <br><br>
          <button mat-raised-button color="accent" (click)="uploadBaseline()" [disabled]="!selectedFile || uploading">
            <mat-icon>cloud_upload</mat-icon>
            Upload Baseline
          </button>
          <mat-progress-bar *ngIf="uploading" mode="indeterminate"></mat-progress-bar>
        </mat-card-content>
      </mat-card>

      <mat-card *ngIf="baseline">
        <mat-card-header>
          <mat-card-title>Baseline Summary</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p><strong>Version:</strong> {{ baseline.baseline_version }}</p>
          <p><strong>Prediction Rate:</strong> {{ baseline.prediction_rate | number:'1.2-4' }}</p>
          <p><strong>Created:</strong> {{ baseline.created_at | date:'short' }}</p>
          
          <h3>Features ({{ baseline.features.length }})</h3>
          <table mat-table [dataSource]="baseline.features" class="mat-elevation-z2">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Feature Name</th>
              <td mat-cell *matCellDef="let feature">{{ feature.name }}</td>
            </ng-container>
            
            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef>Type</th>
              <td mat-cell *matCellDef="let feature">{{ feature.feature_type }}</td>
            </ng-container>
            
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
          
          <div style="margin-top: 20px;">
            <button mat-raised-button color="primary" [routerLink]="['/projects', projectId, 'incoming']">
              <mat-icon>cloud_upload</mat-icon>
              Upload Incoming Data
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    table {
      width: 100%;
      margin-top: 10px;
    }
  `]
})
export class BaselineComponent implements OnInit {
  projectId = '';
  selectedFile: File | null = null;
  uploading = false;
  baseline: BaselineMetadata | null = null;
  displayedColumns = ['name', 'type'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private baselineService: BaselineService
  ) {}

  ngOnInit() {
    this.projectId = this.route.snapshot.paramMap.get('id') || '';
    this.loadBaseline();
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  uploadBaseline() {
    if (!this.selectedFile || !this.projectId) {
      return;
    }

    this.uploading = true;
    this.baselineService.uploadBaseline(this.projectId, this.selectedFile).subscribe({
      next: (response) => {
        this.uploading = false;
        this.selectedFile = null;
        this.loadBaseline();
        alert('Baseline uploaded successfully!');
      },
      error: (err) => {
        this.uploading = false;
        console.error('Failed to upload baseline:', err);
        alert('Failed to upload baseline: ' + (err.error?.error || err.message));
      }
    });
  }

  loadBaseline() {
    if (!this.projectId) {
      return;
    }

    this.baselineService.getBaseline(this.projectId).subscribe({
      next: (baseline) => {
        this.baseline = baseline;
      },
      error: (err) => {
        if (err.status !== 404) {
          console.error('Failed to load baseline:', err);
        }
        // 404 is expected if no baseline exists yet
      }
    });
  }

  goBack() {
    this.router.navigate(['/projects']);
  }
}

