import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
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
    MatProgressSpinnerModule,
    MatTableModule,
    MatChipsModule
  ],
  templateUrl: './baseline.component.html',
  styleUrls: ['./baseline.component.scss']
})
export class BaselineComponent implements OnInit {
  projectId = '';
  selectedFile: File | null = null;
  uploading = false;
  baseline: BaselineMetadata | null = null;
  displayedColumns = ['name', 'type'];
  loading = false;

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

  clearFile(event: Event) {
    event.stopPropagation();
    this.selectedFile = null;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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

    this.loading = true;
    this.baselineService.getBaseline(this.projectId).subscribe({
      next: (baseline) => {
        this.baseline = baseline;
        this.loading = false;
      },
      error: (err) => {
        if (err.status !== 404) {
          console.error('Failed to load baseline:', err);
        }
        this.loading = false;
      }
    });
  }

  goBack() {
    this.router.navigate(['/projects']);
  }
}

