import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AppComponent } from './app.component';
import { AlertsService } from './services/alerts.service';
import { ProjectsService } from './services/projects.service';
import { NotificationsPanelComponent } from './notifications/notifications-panel.component';
import { of } from 'rxjs';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let alertsService: jest.Mocked<AlertsService>;
  let projectsService: jest.Mocked<ProjectsService>;

  beforeEach(async () => {
    // Clear all timers
    jest.useFakeTimers();
    
    const alertsServiceMock = {
      listAlerts: jest.fn().mockReturnValue(of([]))
    };

    const projectsServiceMock = {
      listProjects: jest.fn().mockReturnValue(of([]))
    };

    await TestBed.configureTestingModule({
      imports: [
        AppComponent,
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
        NoopAnimationsModule
      ],
      providers: [
        { provide: AlertsService, useValue: alertsServiceMock },
        { provide: ProjectsService, useValue: projectsServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    alertsService = TestBed.inject(AlertsService) as jest.Mocked<AlertsService>;
    projectsService = TestBed.inject(ProjectsService) as jest.Mocked<ProjectsService>;
    
    fixture.detectChanges();
  });

  afterEach(() => {
    // Clean up any pending timers/intervals
    jest.clearAllTimers();
    jest.useRealTimers();
    
    // Clean up fixture
    if (fixture) {
      fixture.destroy();
    }
    
    // Clear all mocks
    jest.clearAllMocks();
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

    // Reset call counts
    projectsService.listProjects.mockClear();
    alertsService.listAlerts.mockClear();

    component.ngOnInit();
    
    // Fast-forward timers to avoid interval warnings
    jest.advanceTimersByTime(0);

    expect(projectsService.listProjects).toHaveBeenCalled();
  });

  it('should open notifications dialog', () => {
    const dialogOpenSpy = jest
      .spyOn((component as any).dialog as MatDialog, 'open')
      .mockReturnValue({ afterClosed: () => of(null) } as MatDialogRef<any>);
    
    component.openNotifications();

    expect(dialogOpenSpy).toHaveBeenCalledTimes(1);
    expect(dialogOpenSpy).toHaveBeenCalledWith(
      NotificationsPanelComponent,
      expect.objectContaining({
        width: '480px',
        maxWidth: '90vw',
        panelClass: 'notifications-dialog'
      })
    );
  });
});

