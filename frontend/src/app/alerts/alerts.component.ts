import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import {
    MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { Alert, AlertsService } from '../services/alerts.service';
import { AlertDetailsDialog } from './alert-details-dialog.component';

@Component({
	selector: "app-alerts",
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
		MatDialogModule,
		MatProgressSpinnerModule,
		MatTooltipModule,
	],
	templateUrl: './alerts.component.html',
	styleUrls: ['./alerts.component.scss']
})
export class AlertsComponent implements OnInit {
	projectId = "";
	alerts: Alert[] = [];
	statusFilter = "";
	severityFilter = "";
	loading = true;
	displayedColumns = [
		"created_at",
		"severity",
		"alert_type",
		"feature_name",
		"message",
		"metric_value",
		"status",
		"actions",
	];

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private alertsService: AlertsService,
		private dialog: MatDialog,
	) {}

	ngOnInit() {
		this.projectId = this.route.snapshot.paramMap.get("id") || "";
		this.loadAlerts();
	}

	loadAlerts() {
		this.loading = true;
		const status = this.statusFilter || undefined;
		const severity = this.severityFilter || undefined;

		this.alertsService
			.listAlerts(this.projectId, status, severity)
			.subscribe({
				next: (alerts) => {
					this.alerts = alerts;
					this.loading = false;
				},
				error: (err) => {
					console.error("Failed to load alerts:", err);
					this.loading = false;
				},
			});
	}

	clearFilters() {
		this.statusFilter = "";
		this.severityFilter = "";
		this.loadAlerts();
	}

	showDetails(alert: Alert) {
		this.dialog.open(AlertDetailsDialog, {
			width: "600px",
			maxWidth: "90vw",
			data: alert,
		});
	}

	ackAlert(alert: Alert) {
		this.alertsService.ackAlert(this.projectId, alert.alert_id).subscribe({
			next: () => {
				this.loadAlerts();
			},
			error: (err) => {
				console.error("Failed to acknowledge alert:", err);
				window.alert(
					"Failed to acknowledge alert: " +
						(err.error?.error || err.message),
				);
			},
		});
	}

	getSeverityColor(severity: string): "primary" | "accent" | "warn" {
		if (severity === "CRITICAL") return "warn";
		if (severity === "WARN") return "accent";
		return "primary";
	}

	getSeverityIcon(severity: string): string {
		if (severity === "CRITICAL") return "error";
		if (severity === "WARN") return "warning";
		return "info";
	}

	getCriticalCount(): number {
		return this.alerts.filter((a) => a.severity === "CRITICAL").length;
	}

	getWarningCount(): number {
		return this.alerts.filter((a) => a.severity === "WARN").length;
	}

	getOpenCount(): number {
		return this.alerts.filter((a) => a.status === "OPEN").length;
	}

	goBack() {
		this.router.navigate(["/projects"]);
	}
}
