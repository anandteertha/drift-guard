import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { ProjectsService, Project } from '../services/projects.service';

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
    MatListModule
  ],
  template: `
    <div>
      <h1>Projects</h1>
      
      <mat-card style="margin-bottom: 20px;">
        <mat-card-header>
          <mat-card-title>Create New Project</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <mat-form-field appearance="outline" style="width: 100%;">
            <mat-label>Project Name</mat-label>
            <input matInput [(ngModel)]="newProjectName" placeholder="Enter project name">
          </mat-form-field>
          <button mat-raised-button color="primary" (click)="createProject()" [disabled]="!newProjectName">
            Create Project
          </button>
        </mat-card-content>
      </mat-card>

      <mat-card>
        <mat-card-header>
          <mat-card-title>All Projects</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <mat-list>
            <mat-list-item *ngFor="let project of projects">
              <mat-icon matListItemIcon>folder</mat-icon>
              <div matListItemTitle>{{ project.name }}</div>
              <div matListItemLine>{{ project.created_at | date:'short' }}</div>
              <button mat-icon-button [routerLink]="['/projects', project.project_id, 'baseline']" matListItemMeta title="Upload Baseline">
                <mat-icon>upload</mat-icon>
              </button>
              <button mat-icon-button [routerLink]="['/projects', project.project_id, 'incoming']" matListItemMeta title="Upload Incoming">
                <mat-icon>cloud_upload</mat-icon>
              </button>
              <button mat-icon-button [routerLink]="['/projects', project.project_id, 'alerts']" matListItemMeta title="View Alerts">
                <mat-icon>notifications</mat-icon>
              </button>
            </mat-list-item>
          </mat-list>
        </mat-card-content>
      </mat-card>
    </div>
  `
})
export class ProjectsComponent implements OnInit {
  projects: Project[] = [];
  newProjectName = '';

  constructor(
    private projectsService: ProjectsService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadProjects();
  }

  loadProjects() {
    this.projectsService.listProjects().subscribe({
      next: (projects) => {
        this.projects = projects;
      },
      error: (err) => {
        console.error('Failed to load projects:', err);
      }
    });
  }

  createProject() {
    if (!this.newProjectName.trim()) {
      return;
    }

    this.projectsService.createProject(this.newProjectName).subscribe({
      next: (project) => {
        this.newProjectName = '';
        this.loadProjects();
      },
      error: (err) => {
        console.error('Failed to create project:', err);
        alert('Failed to create project: ' + (err.error?.error || err.message));
      }
    });
  }
}

