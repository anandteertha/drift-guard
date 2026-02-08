import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, MatToolbarModule, MatButtonModule, MatIconModule],
  template: `
    <mat-toolbar color="primary">
      <mat-icon>security</mat-icon>
      <span style="margin-left: 8px;">DriftGuard</span>
      <span style="flex: 1 1 auto;"></span>
      <button mat-button routerLink="/projects">
        <mat-icon>folder</mat-icon>
        Projects
      </button>
    </mat-toolbar>
    <div style="padding: 20px;">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    mat-toolbar {
      margin-bottom: 20px;
    }
  `]
})
export class AppComponent {
  title = 'DriftGuard';
}

