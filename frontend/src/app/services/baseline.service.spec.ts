import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BaselineService, BaselineMetadata } from './baseline.service';

describe('BaselineService', () => {
  let service: BaselineService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [BaselineService]
    });
    service = TestBed.inject(BaselineService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should upload baseline', () => {
    const mockFile = new File(['test'], 'test.csv', { type: 'text/csv' });
    const mockResponse = {
      baseline_version: 1,
      prediction_rate: 0.1,
      features: []
    };

    service.uploadBaseline('project123', mockFile).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('http://127.0.0.1:8080/api/projects/project123/baseline/upload');
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBeTruthy();
    req.flush(mockResponse);
  });

  it('should get baseline', () => {
    const mockBaseline: BaselineMetadata = {
      baseline_version: 1,
      prediction_rate: 0.1,
      created_at: '2024-01-01T00:00:00Z',
      features: []
    };

    service.getBaseline('project123').subscribe(baseline => {
      expect(baseline).toEqual(mockBaseline);
    });

    const req = httpMock.expectOne('http://127.0.0.1:8080/api/projects/project123/baseline');
    expect(req.request.method).toBe('GET');
    req.flush(mockBaseline);
  });
});

