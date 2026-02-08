import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { IncomingService, UploadIncomingResponse } from './incoming.service';

describe('IncomingService', () => {
  let service: IncomingService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [IncomingService]
    });
    service = TestBed.inject(IncomingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should upload incoming data', () => {
    const mockFile = new File(['test,data\n1,2'], 'test.csv', { type: 'text/csv' });
    const mockResponse: UploadIncomingResponse = {
      rows_processed: 10,
      alerts_created: 2,
      health: 'WARN'
    };

    service.uploadIncoming('project123', mockFile).subscribe(response => {
      expect(response).toEqual(mockResponse);
      expect(response.rows_processed).toBe(10);
      expect(response.alerts_created).toBe(2);
      expect(response.health).toBe('WARN');
    });

    const req = httpMock.expectOne('http://127.0.0.1:8080/api/projects/project123/incoming/upload');
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBeTruthy();
    expect(req.request.body.get('file')).toBe(mockFile);
    req.flush(mockResponse);
  });

  it('should handle successful upload with no alerts', () => {
    const mockFile = new File(['test'], 'test.csv', { type: 'text/csv' });
    const mockResponse: UploadIncomingResponse = {
      rows_processed: 5,
      alerts_created: 0,
      health: 'OK'
    };

    service.uploadIncoming('project123', mockFile).subscribe(response => {
      expect(response.health).toBe('OK');
      expect(response.alerts_created).toBe(0);
    });

    const req = httpMock.expectOne('http://127.0.0.1:8080/api/projects/project123/incoming/upload');
    req.flush(mockResponse);
  });

  it('should handle critical health status', () => {
    const mockFile = new File(['test'], 'test.csv', { type: 'text/csv' });
    const mockResponse: UploadIncomingResponse = {
      rows_processed: 20,
      alerts_created: 5,
      health: 'CRITICAL'
    };

    service.uploadIncoming('project123', mockFile).subscribe(response => {
      expect(response.health).toBe('CRITICAL');
    });

    const req = httpMock.expectOne('http://127.0.0.1:8080/api/projects/project123/incoming/upload');
    req.flush(mockResponse);
  });
});

