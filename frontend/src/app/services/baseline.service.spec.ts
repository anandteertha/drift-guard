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

  it('should handle baseline with features', () => {
    const mockBaseline: BaselineMetadata = {
      baseline_version: 1,
      prediction_rate: 0.15,
      created_at: '2024-01-01T00:00:00Z',
      features: [
        {
          name: 'income',
          feature_type: 'numeric',
          metadata: { bins: [0, 10, 20], probabilities: [0.3, 0.5, 0.2] }
        },
        {
          name: 'category',
          feature_type: 'categorical',
          metadata: { frequencies: { 'A': 0.5, 'B': 0.5 } }
        }
      ]
    };

    service.getBaseline('project123').subscribe(baseline => {
      expect(baseline.features.length).toBe(2);
      expect(baseline.features[0].name).toBe('income');
      expect(baseline.features[1].name).toBe('category');
    });

    const req = httpMock.expectOne('http://127.0.0.1:8080/api/projects/project123/baseline');
    req.flush(mockBaseline);
  });

  it('should handle upload error', () => {
    const mockFile = new File(['test'], 'test.csv', { type: 'text/csv' });
    const errorResponse = { error: 'Invalid CSV format' };

    service.uploadBaseline('project123', mockFile).subscribe({
      next: () => fail('should have failed'),
      error: (error) => {
        expect(error.error).toEqual(errorResponse);
      }
    });

    const req = httpMock.expectOne('http://127.0.0.1:8080/api/projects/project123/baseline/upload');
    req.flush(errorResponse, { status: 400, statusText: 'Bad Request' });
  });
});

