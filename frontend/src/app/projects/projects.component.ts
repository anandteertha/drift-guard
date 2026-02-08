import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProjectsService, Project } from '../services/projects.service';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss']
})
export class ProjectsComponent implements OnInit {
  projects: Project[] = [];
  newProjectName = '';
  creating = false;
  loading = true;
  showCreateForm = false;

  constructor(
    private projectsService: ProjectsService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.loadProjects();
  }

  loadProjects() {
    this.loading = true;
    this.projectsService.listProjects().subscribe({
      next: (projects) => {
        this.projects = projects;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load projects:', err);
        this.loading = false;
      }
    });
  }

  createProject() {
    if (!this.newProjectName.trim() || this.creating) {
      return;
    }

    this.creating = true;
    this.projectsService.createProject(this.newProjectName).subscribe({
      next: (project) => {
        this.newProjectName = '';
        this.creating = false;
        this.showCreateForm = false;
        this.loadProjects();
        this.notificationService.success('Project created successfully!');
      },
      error: (err) => {
        console.error('Failed to create project:', err);
        this.creating = false;
        this.notificationService.error('Failed to create project: ' + (err.error?.error || err.message));
      }
    });
  }
}

