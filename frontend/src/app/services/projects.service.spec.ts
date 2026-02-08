import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProjectsService, Project } from './projects.service';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProjectsService]
    });
    service = TestBed.inject(ProjectsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create a project', () => {
    const mockProject: Project = {
      project_id: '123',
      name: 'Test Project',
      created_at: '2024-01-01T00:00:00Z'
    };

    service.createProject('Test Project').subscribe(project => {
      expect(project).toEqual(mockProject);
    });

    const req = httpMock.expectOne('http://127.0.0.1:8080/api/projects');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'Test Project' });
    req.flush(mockProject);
  });

  it('should list projects', () => {
    const mockProjects: Project[] = [
      {
        project_id: '123',
        name: 'Test Project 1',
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        project_id: '456',
        name: 'Test Project 2',
        created_at: '2024-01-02T00:00:00Z'
      }
    ];

    service.listProjects().subscribe(projects => {
      expect(projects.length).toBe(2);
      expect(projects).toEqual(mockProjects);
    });

    const req = httpMock.expectOne('http://127.0.0.1:8080/api/projects');
    expect(req.request.method).toBe('GET');
    req.flush(mockProjects);
  });

  it('should get a project', () => {
    const mockProject: Project = {
      project_id: '123',
      name: 'Test Project',
      created_at: '2024-01-01T00:00:00Z'
    };

    service.getProject('123').subscribe(project => {
      expect(project).toEqual(mockProject);
    });

    const req = httpMock.expectOne('http://127.0.0.1:8080/api/projects/123');
    expect(req.request.method).toBe('GET');
    req.flush(mockProject);
  });
});

