import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AlertsService, Alert } from './alerts.service';

describe('AlertsService', () => {
  let service: AlertsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AlertsService]
    });
    service = TestBed.inject(AlertsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should list alerts', () => {
    const mockAlerts: Alert[] = [
      {
        alert_id: '1',
        project_id: '123',
        baseline_version: 1,
        created_at: '2024-01-01T00:00:00Z',
        severity: 'WARN',
        alert_type: 'FEATURE_DRIFT',
        feature_name: 'income',
        metric_value: 0.15,
        message: 'Test alert',
        status: 'OPEN'
      }
    ];

    service.listAlerts('123').subscribe(alerts => {
      expect(alerts.length).toBe(1);
      expect(alerts).toEqual(mockAlerts);
    });

    const req = httpMock.expectOne('http://127.0.0.1:8080/api/projects/123/alerts');
    expect(req.request.method).toBe('GET');
    req.flush(mockAlerts);
  });

  it('should list alerts with filters', () => {
    const mockAlerts: Alert[] = [];

    service.listAlerts('123', 'OPEN', 'WARN').subscribe(alerts => {
      expect(alerts).toEqual(mockAlerts);
    });

    const req = httpMock.expectOne('http://127.0.0.1:8080/api/projects/123/alerts?status=OPEN&severity=WARN');
    expect(req.request.method).toBe('GET');
    req.flush(mockAlerts);
  });

  it('should acknowledge alert', () => {
    service.ackAlert('123', 'alert1').subscribe(response => {
      expect(response).toBeTruthy();
    });

    const req = httpMock.expectOne('http://127.0.0.1:8080/api/projects/123/alerts/alert1/ack');
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'Alert acknowledged' });
  });
});

