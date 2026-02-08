import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AlertsService, Alert } from '../services/alerts.service';
import { ProjectsService, Project } from '../services/projects.service';
import { forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-notifications-panel',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './notifications-panel.component.html',
  styleUrls: ['./notifications-panel.component.scss']
})
export class NotificationsPanelComponent implements OnInit {
  alerts: Alert[] = [];
  loading = true;
  projects: Project[] = [];

  constructor(
    public dialogRef: MatDialogRef<NotificationsPanelComponent>,
    private alertsService: AlertsService,
    private projectsService: ProjectsService
  ) {}

  ngOnInit() {
    this.loadAllAlerts();
  }

  loadAllAlerts() {
    this.loading = true;
    // First get all projects
    this.projectsService.listProjects().subscribe({
      next: (projects) => {
        this.projects = projects;
        // Then get alerts for each project using forkJoin
        const alertObservables = projects.map(project => 
          this.alertsService.listAlerts(project.project_id, 'OPEN').pipe(
            catchError(() => of([] as Alert[]))
          )
        );
        
        if (alertObservables.length === 0) {
          this.alerts = [];
          this.loading = false;
          return;
        }
        
        forkJoin(alertObservables).subscribe({
          next: (results) => {
            this.alerts = results
              .flat()
              .filter(alert => alert !== undefined)
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            this.loading = false;
          },
          error: (err) => {
            console.error('Failed to load alerts:', err);
            this.loading = false;
          }
        });
      },
      error: (err) => {
        console.error('Failed to load projects:', err);
        this.loading = false;
      }
    });
  }

  getProjectName(projectId: string): string {
    const project = this.projects.find(p => p.project_id === projectId);
    return project ? project.name : 'Unknown Project';
  }

  getSeverityColor(severity: string): string {
    if (severity === 'CRITICAL') return 'error';
    if (severity === 'WARN') return 'accent';
    return 'primary';
  }

  getSeverityIcon(severity: string): string {
    if (severity === 'CRITICAL') return 'error';
    if (severity === 'WARN') return 'warning';
    return 'info';
  }

  goToAlerts(projectId: string) {
    this.dialogRef.close();
    // Navigation will be handled by router link in template
  }

  close() {
    this.dialogRef.close();
  }
}

