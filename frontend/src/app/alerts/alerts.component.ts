import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { Alert, AlertsService } from '../services/alerts.service';
import { NotificationService } from '../services/notification.service';
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
		MatPaginatorModule,
		MatSelectModule,
		MatFormFieldModule,
		MatInputModule,
		MatChipsModule,
		MatDialogModule,
		MatProgressSpinnerModule,
		MatTooltipModule,
	],
	templateUrl: "./alerts.component.html",
	styleUrls: ["./alerts.component.scss"],
})
export class AlertsComponent implements OnInit, AfterViewInit {
	@ViewChild(MatPaginator) paginator!: MatPaginator;

	projectId = "";
	alerts: Alert[] = [];
	dataSource = new MatTableDataSource<Alert>([]);
	statusFilter = "";
	severityFilter = "";
	featureFilter = "";
	alertTypeFilter = "";
	startTimeFilter = "";
	endTimeFilter = "";
	loading = true;

	// Available alert types for filter
	alertTypes: string[] = [];
	// Available feature names for filter
	featureNames: (string | null)[] = [];
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
		private notificationService: NotificationService,
	) {}

	ngOnInit() {
		this.projectId = this.route.snapshot.paramMap.get("id") || "";
		// Load all alerts first to populate filter dropdowns
		this.alertsService.listAlerts(this.projectId).subscribe({
			next: (allAlerts) => {
				this.alertTypes = [
					...new Set(
						allAlerts.map((a) => a.alert_type).filter((t) => t),
					),
				].sort();
				this.featureNames = [
					...new Set(
						allAlerts.map((a) => a.feature_name).filter((f) => f),
					),
				].sort();
			},
		});
		this.loadAlerts();
	}

	ngAfterViewInit() {
		this.dataSource.paginator = this.paginator;
	}

	loadAlerts() {
		this.loading = true;
		const status = this.statusFilter || undefined;
		const severity = this.severityFilter || undefined;
		const featureName = this.featureFilter || undefined;
		const alertType = this.alertTypeFilter || undefined;
		// Convert datetime-local format to ISO 8601 for backend
		const startTime = this.startTimeFilter
			? new Date(this.startTimeFilter).toISOString()
			: undefined;
		const endTime = this.endTimeFilter
			? new Date(this.endTimeFilter).toISOString()
			: undefined;

		this.alertsService
			.listAlerts(
				this.projectId,
				status,
				severity,
				featureName,
				alertType,
				startTime,
				endTime,
			)
			.subscribe({
				next: (alerts) => {
					this.alerts = alerts;
					this.dataSource.data = alerts;
					if (this.paginator) {
						this.dataSource.paginator = this.paginator;
					}
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
		this.featureFilter = "";
		this.alertTypeFilter = "";
		this.startTimeFilter = "";
		this.endTimeFilter = "";
		this.loadAlerts();
	}

	hasActiveFilters(): boolean {
		return !!(
			this.statusFilter ||
			this.severityFilter ||
			this.featureFilter ||
			this.alertTypeFilter ||
			this.startTimeFilter ||
			this.endTimeFilter
		);
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
				this.notificationService.error(
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
