import { Routes } from '@angular/router';
import { ProjectsComponent } from './projects/projects.component';
import { BaselineComponent } from './baseline/baseline.component';
import { IncomingComponent } from './incoming/incoming.component';
import { AlertsComponent } from './alerts/alerts.component';

export const routes: Routes = [
  { path: '', redirectTo: '/projects', pathMatch: 'full' },
  { path: 'projects', component: ProjectsComponent },
  { path: 'projects/:id/baseline', component: BaselineComponent },
  { path: 'projects/:id/incoming', component: IncomingComponent },
  { path: 'projects/:id/alerts', component: AlertsComponent },
];

