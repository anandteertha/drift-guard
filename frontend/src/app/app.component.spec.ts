import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppComponent } from './app.component';
import { AlertsService } from './services/alerts.service';
import { ProjectsService } from './services/projects.service';
import { of, forkJoin } from 'rxjs';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let alertsService: jest.Mocked<AlertsService>;
  let projectsService: jest.Mocked<ProjectsService>;
  let dialog: MatDialog;

  beforeEach(async () => {
    const alertsServiceMock = {
      listAlerts: jest.fn().mockReturnValue(of([]))
    };

    const projectsServiceMock = {
      listProjects: jest.fn().mockReturnValue(of([]))
    };

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        MatDialogModule,
        MatSnackBarModule,
        MatToolbarModule,
        MatButtonModule,
        MatIconModule,
        MatSidenavModule,
        MatListModule,
        MatBadgeModule,
        MatTooltipModule,
        BrowserAnimationsModule
      ],
      declarations: [AppComponent],
      providers: [
        { provide: AlertsService, useValue: alertsServiceMock },
        { provide: ProjectsService, useValue: projectsServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    alertsService = TestBed.inject(AlertsService) as jest.Mocked<AlertsService>;
    projectsService = TestBed.inject(ProjectsService) as jest.Mocked<ProjectsService>;
    dialog = TestBed.inject(MatDialog);
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should have title DriftGuard', () => {
    expect(component.title).toBe('DriftGuard');
  });

  it('should initialize with zero alerts count', () => {
    expect(component.openAlertsCount).toBe(0);
  });

  it('should load alerts count on init', () => {
    const mockProjects = [
      { project_id: '1', name: 'Project 1', created_at: '2024-01-01' }
    ];
    const mockAlerts = [
      { alert_id: '1', project_id: '1', baseline_version: 1, created_at: '2024-01-01', severity: 'WARN', alert_type: 'FEATURE_DRIFT', feature_name: 'test', metric_value: 0.1, message: 'test', status: 'OPEN' }
    ];

    projectsService.listProjects.mockReturnValue(of(mockProjects));
    alertsService.listAlerts.mockReturnValue(of(mockAlerts));

    component.ngOnInit();

    expect(projectsService.listProjects).toHaveBeenCalled();
  });

  it('should open notifications dialog', () => {
    const dialogOpenSpy = jest.spyOn(dialog, 'open').mockReturnValue({
      afterClosed: () => of(null)
    } as any);

    component.openNotifications();

    expect(dialogOpenSpy).toHaveBeenCalled();
  });
});

