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

  it('should list alerts with status and severity filters', () => {
    const mockAlerts: Alert[] = [];

    service.listAlerts('123', 'OPEN', 'WARN').subscribe(alerts => {
      expect(alerts).toEqual(mockAlerts);
    });

    const req = httpMock.expectOne('http://127.0.0.1:8080/api/projects/123/alerts?status=OPEN&severity=WARN');
    expect(req.request.method).toBe('GET');
    req.flush(mockAlerts);
  });

  it('should list alerts with all filters', () => {
    const mockAlerts: Alert[] = [];
    const startTime = '2024-01-01T00:00:00Z';
    const endTime = '2024-01-31T23:59:59Z';

    service.listAlerts('123', 'OPEN', 'WARN', 'income', 'FEATURE_DRIFT', startTime, endTime).subscribe(alerts => {
      expect(alerts).toEqual(mockAlerts);
    });

    const req = httpMock.expectOne(
      (request) => request.url === 'http://127.0.0.1:8080/api/projects/123/alerts' &&
        request.params.get('status') === 'OPEN' &&
        request.params.get('severity') === 'WARN' &&
        request.params.get('feature_name') === 'income' &&
        request.params.get('alert_type') === 'FEATURE_DRIFT' &&
        request.params.get('start_time') === startTime &&
        request.params.get('end_time') === endTime
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockAlerts);
  });

  it('should list alerts with feature name filter', () => {
    const mockAlerts: Alert[] = [];

    service.listAlerts('123', undefined, undefined, 'income').subscribe(alerts => {
      expect(alerts).toEqual(mockAlerts);
    });

    const req = httpMock.expectOne('http://127.0.0.1:8080/api/projects/123/alerts?feature_name=income');
    expect(req.request.method).toBe('GET');
    req.flush(mockAlerts);
  });

  it('should list alerts with alert type filter', () => {
    const mockAlerts: Alert[] = [];

    service.listAlerts('123', undefined, undefined, undefined, 'FEATURE_DRIFT').subscribe(alerts => {
      expect(alerts).toEqual(mockAlerts);
    });

    const req = httpMock.expectOne('http://127.0.0.1:8080/api/projects/123/alerts?alert_type=FEATURE_DRIFT');
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

