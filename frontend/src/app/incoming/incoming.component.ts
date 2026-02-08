import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { IncomingService, UploadIncomingResponse } from '../services/incoming.service';
import { NotificationService } from '../services/notification.service';

@Component({
	selector: "app-incoming",
	standalone: true,
	imports: [
		CommonModule,
		RouterModule,
		MatCardModule,
		MatButtonModule,
		MatIconModule,
		MatProgressBarModule,
		MatProgressSpinnerModule,
		MatChipsModule,
	],
	templateUrl: "./incoming.component.html",
	styleUrls: ["./incoming.component.scss"],
})
export class IncomingComponent implements OnInit {
	projectId = "";
	selectedFile: File | null = null;
	uploading = false;
	uploadResult: UploadIncomingResponse | null = null;

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private incomingService: IncomingService,
		private notificationService: NotificationService,
	) {}

	ngOnInit() {
		this.projectId = this.route.snapshot.paramMap.get("id") || "";
	}

	onFileSelected(event: any) {
		this.selectedFile = event.target.files[0];
		this.uploadResult = null;
	}

	clearFile(event: Event) {
		event.stopPropagation();
		this.selectedFile = null;
		this.uploadResult = null;
	}

	formatFileSize(bytes: number): string {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return (
			Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
		);
	}

	resetUpload() {
		this.selectedFile = null;
		this.uploadResult = null;
	}

	getHealthIcon(health: string): string {
		if (health === "OK") return "check_circle";
		if (health === "WARN") return "warning";
		return "error";
	}

	getHealthClass(health: string): string {
		if (health === "OK") return "success";
		if (health === "WARN") return "warning";
		return "error";
	}

	uploadIncoming() {
		if (!this.selectedFile || !this.projectId) {
			return;
		}

		this.uploading = true;
		this.incomingService
			.uploadIncoming(this.projectId, this.selectedFile)
			.subscribe({
				next: (result) => {
					this.uploading = false;
					this.uploadResult = result;
					this.selectedFile = null;
				},
				error: (err) => {
					this.uploading = false;
					console.error("Failed to upload incoming data:", err);
					this.notificationService.error(
						"Failed to upload incoming data: " +
							(err.error?.error || err.message),
					);
				},
			});
	}

	getHealthColor(health: string): "primary" | "accent" | "warn" {
		if (health === "OK") return "primary";
		if (health === "WARN") return "accent";
		return "warn";
	}

	goBack() {
		this.router.navigate(["/projects"]);
	}
}
