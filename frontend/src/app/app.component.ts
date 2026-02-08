import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { AlertsService } from './services/alerts.service';
import { ProjectsService } from './services/projects.service';
import { NotificationsPanelComponent } from './notifications/notifications-panel.component';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
    MatSnackBarModule,
    MatBadgeModule,
    MatDialogModule,
    MatTooltipModule,
    CommonModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'DriftGuard';
  openAlertsCount = 0;

  constructor(
    private dialog: MatDialog,
    private alertsService: AlertsService,
    private projectsService: ProjectsService
  ) {}

  ngOnInit() {
    this.loadAlertsCount();
    // Refresh count every 30 seconds
    setInterval(() => this.loadAlertsCount(), 30000);
  }

  loadAlertsCount() {
    this.projectsService.listProjects().subscribe({
      next: (projects) => {
        if (projects.length === 0) {
          this.openAlertsCount = 0;
          return;
        }
        
        const alertObservables = projects.map(project => 
          this.alertsService.listAlerts(project.project_id, 'OPEN').pipe(
            catchError(() => of([]))
          )
        );
        
        forkJoin(alertObservables).subscribe({
          next: (results) => {
            const allAlerts = results.flat().filter(alert => alert !== undefined);
            this.openAlertsCount = allAlerts.length;
          },
          error: () => {
            this.openAlertsCount = 0;
          }
        });
      },
      error: () => {
        this.openAlertsCount = 0;
      }
    });
  }

  openNotifications() {
    this.dialog.open(NotificationsPanelComponent, {
      width: '480px',
      maxWidth: '90vw',
      panelClass: 'notifications-dialog'
    });
  }
}

