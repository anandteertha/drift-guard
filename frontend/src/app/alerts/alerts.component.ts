import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { AlertsService, Alert } from '../services/alerts.service';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatSelectModule,
    MatFormFieldModule,
    MatChipsModule,
    MatDialogModule
  ],
  template: `
    <div>
      <button mat-button (click)="goBack()">
        <mat-icon>arrow_back</mat-icon>
        Back to Projects
      </button>
      
      <h1>Alerts</h1>
      
      <mat-card style="margin-bottom: 20px;">
        <mat-card-content>
          <mat-form-field appearance="outline" style="margin-right: 10px;">
            <mat-label>Status</mat-label>
            <mat-select [(ngModel)]="statusFilter" (selectionChange)="loadAlerts()">
              <mat-option value="">All</mat-option>
              <mat-option value="OPEN">Open</mat-option>
              <mat-option value="ACK">Acknowledged</mat-option>
            </mat-select>
          </mat-form-field>
          
          <mat-form-field appearance="outline">
            <mat-label>Severity</mat-label>
            <mat-select [(ngModel)]="severityFilter" (selectionChange)="loadAlerts()">
              <mat-option value="">All</mat-option>
              <mat-option value="WARN">Warning</mat-option>
              <mat-option value="CRITICAL">Critical</mat-option>
            </mat-select>
          </mat-form-field>
        </mat-card-content>
      </mat-card>

      <mat-card>
        <mat-card-content>
          <table mat-table [dataSource]="alerts" class="mat-elevation-z2">
            <ng-container matColumnDef="created_at">
              <th mat-header-cell *matHeaderCellDef>Time</th>
              <td mat-cell *matCellDef="let alert">{{ alert.created_at | date:'short' }}</td>
            </ng-container>
            
            <ng-container matColumnDef="severity">
              <th mat-header-cell *matHeaderCellDef>Severity</th>
              <td mat-cell *matCellDef="let alert">
                <mat-chip [color]="getSeverityColor(alert.severity)">
                  {{ alert.severity }}
                </mat-chip>
              </td>
            </ng-container>
            
            <ng-container matColumnDef="alert_type">
              <th mat-header-cell *matHeaderCellDef>Type</th>
              <td mat-cell *matCellDef="let alert">{{ alert.alert_type }}</td>
            </ng-container>
            
            <ng-container matColumnDef="feature_name">
              <th mat-header-cell *matHeaderCellDef>Feature</th>
              <td mat-cell *matCellDef="let alert">{{ alert.feature_name || '-' }}</td>
            </ng-container>
            
            <ng-container matColumnDef="message">
              <th mat-header-cell *matHeaderCellDef>Message</th>
              <td mat-cell *matCellDef="let alert">{{ alert.message }}</td>
            </ng-container>
            
            <ng-container matColumnDef="metric_value">
              <th mat-header-cell *matHeaderCellDef>Metric</th>
              <td mat-cell *matCellDef="let alert">{{ alert.metric_value | number:'1.4-4' }}</td>
            </ng-container>
            
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let alert">{{ alert.status }}</td>
            </ng-container>
            
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let alert">
                <button mat-icon-button (click)="showDetails(alert)" *ngIf="alert.status === 'OPEN'">
                  <mat-icon>info</mat-icon>
                </button>
                <button mat-icon-button (click)="ackAlert(alert)" *ngIf="alert.status === 'OPEN'">
                  <mat-icon>check</mat-icon>
                </button>
              </td>
            </ng-container>
            
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    table {
      width: 100%;
    }
  `]
})
export class AlertsComponent implements OnInit {
  projectId = '';
  alerts: Alert[] = [];
  statusFilter = '';
  severityFilter = '';
  displayedColumns = ['created_at', 'severity', 'alert_type', 'feature_name', 'message', 'metric_value', 'status', 'actions'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private alertsService: AlertsService
  ) {}

  ngOnInit() {
    this.projectId = this.route.snapshot.paramMap.get('id') || '';
    this.loadAlerts();
  }

  loadAlerts() {
    const status = this.statusFilter || undefined;
    const severity = this.severityFilter || undefined;
    
    this.alertsService.listAlerts(this.projectId, status, severity).subscribe({
      next: (alerts) => {
        this.alerts = alerts;
      },
      error: (err) => {
        console.error('Failed to load alerts:', err);
      }
    });
  }

  showDetails(alert: Alert) {
    const details = `
      Alert ID: ${alert.alert_id}
      Type: ${alert.alert_type}
      Severity: ${alert.severity}
      Feature: ${alert.feature_name || 'N/A'}
      Metric Value: ${alert.metric_value !== null ? alert.metric_value.toFixed(4) : 'N/A'}
      Baseline Version: ${alert.baseline_version}
      Created: ${new Date(alert.created_at).toLocaleString()}
      Message: ${alert.message}
    `;
    alert(details);
  }

  ackAlert(alert: Alert) {
    this.alertsService.ackAlert(this.projectId, alert.alert_id).subscribe({
      next: () => {
        this.loadAlerts();
      },
      error: (err) => {
        console.error('Failed to acknowledge alert:', err);
        alert('Failed to acknowledge alert: ' + (err.error?.error || err.message));
      }
    });
  }

  getSeverityColor(severity: string): 'primary' | 'accent' | 'warn' {
    if (severity === 'CRITICAL') return 'warn';
    if (severity === 'WARN') return 'accent';
    return 'primary';
  }

  goBack() {
    this.router.navigate(['/projects']);
  }
}

