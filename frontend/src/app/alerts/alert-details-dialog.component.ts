import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Alert } from '../services/alerts.service';

@Component({
	selector: 'alert-details-dialog',
	standalone: true,
	imports: [
		CommonModule,
		MatDialogModule,
		MatButtonModule,
		MatIconModule,
		MatChipsModule,
	],
	templateUrl: './alert-details-dialog.component.html',
	styleUrls: ['./alert-details-dialog.component.scss']
})
export class AlertDetailsDialog {
	constructor(
		public dialogRef: MatDialogRef<AlertDetailsDialog>,
		@Inject(MAT_DIALOG_DATA) public data: Alert
	) {}

	getSeverityColor(severity: string): "primary" | "accent" | "warn" {
		if (severity === "CRITICAL") return "warn";
		if (severity === "WARN") return "accent";
		return "primary";
	}
}

