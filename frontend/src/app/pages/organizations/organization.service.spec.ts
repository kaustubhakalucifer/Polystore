import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { OrganizationService } from './organization.service';
import { environment } from '../../../environments/environment';
import { Organization } from './organization.interface';

describe('OrganizationService', () => {
  let service: OrganizationService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/organizations`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OrganizationService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(OrganizationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getOrganizations', () => {
    it('should fetch a list of organizations', () => {
      const mockResponse = {
        status: 'success',
        statusCode: 200,
        data: [
          { _id: 'org1', name: 'Test Org 1', createdAt: new Date() },
          { _id: 'org2', name: 'Test Org 2', createdAt: new Date() },
        ] as Organization[],
      };

      service.getOrganizations().subscribe((res) => {
        expect(res.data.length).toBe(2);
        expect(res.data[0].name).toBe('Test Org 1');
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('createOrganization', () => {
    it('should create an organization', () => {
      const mockResponse = {
        status: 'success',
        statusCode: 201,
        data: { _id: 'org1', name: 'New Org', createdAt: new Date() } as Organization,
      };

      service.createOrganization('New Org').subscribe((res) => {
        expect(res.data.name).toBe('New Org');
        expect(res.data._id).toBe('org1');
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ name: 'New Org' });
      req.flush(mockResponse);
    });
  });
});
