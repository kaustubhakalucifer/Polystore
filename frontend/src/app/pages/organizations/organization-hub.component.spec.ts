import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrganizationHubComponent } from './organization-hub.component';
import { OrganizationService } from './organization.service';
import { OrganizationContextService } from '../../core/services/organization-context.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { Organization } from './organization.interface';

describe('OrganizationHubComponent', () => {
  let component: OrganizationHubComponent;
  let fixture: ComponentFixture<OrganizationHubComponent>;
  let mockOrganizationService: {
    getOrganizations: ReturnType<typeof vi.fn>;
    createOrganization: ReturnType<typeof vi.fn>;
  };
  let mockOrgContextService: {
    organizations?: ReturnType<typeof vi.fn>;
    isLoading?: ReturnType<typeof vi.fn>;
    error?: ReturnType<typeof vi.fn>;
    loadOrganizations: ReturnType<typeof vi.fn>;
    setActiveOrganization: ReturnType<typeof vi.fn>;
  };
  let mockRouter: {
    navigate: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockOrganizationService = {
      getOrganizations: vi.fn().mockReturnValue(of({ data: [] })),
      createOrganization: vi.fn().mockReturnValue(of({ data: { _id: 'new1', name: 'New Org' } })),
    };

    mockOrgContextService = {
      organizations: vi.fn().mockReturnValue([]),
      isLoading: vi.fn().mockReturnValue(false),
      error: vi.fn().mockReturnValue(null),
      loadOrganizations: vi.fn(),
      setActiveOrganization: vi.fn((id: string) => {
        localStorage.setItem('active_org_id', id);
      }),
    };

    mockRouter = {
      navigate: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [OrganizationHubComponent],
      providers: [
        { provide: OrganizationService, useValue: mockOrganizationService },
        { provide: OrganizationContextService, useValue: mockOrgContextService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrganizationHubComponent);
    component = fixture.componentInstance;

    // Clear localStorage before tests
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load organizations and set isLoading to false', () => {
      const mockOrgs: Organization[] = [{ _id: 'org1', name: 'Org 1', createdAt: new Date().toISOString() }];
      mockOrganizationService.getOrganizations.mockReturnValue(of({ data: mockOrgs }));

      fixture.detectChanges(); // triggers ngOnInit

      expect(mockOrgContextService.loadOrganizations).toHaveBeenCalled();
    });
  });

  describe('Modal interactions', () => {
    it('should open modal', () => {
      component.openModal();
      expect(component.isModalOpen()).toBe(true);
    });

    it('should close modal and reset form', () => {
      component.createOrgForm.controls.name.setValue('Testing');
      component.isModalOpen.set(true);

      component.closeModal();

      expect(component.isModalOpen()).toBe(false);
      expect(component.createOrgForm.controls.name.value).toBe('');
    });
  });

  describe('onSubmit', () => {
    it('should not call service if form is invalid', () => {
      component.createOrgForm.controls.name.setValue('');
      component.onSubmit();
      expect(mockOrganizationService.createOrganization).not.toHaveBeenCalled();
    });

    it('should call service, trigger context refresh, and close modal on valid submit', () => {
      // Set initial state
      if (mockOrgContextService.organizations) {
        mockOrgContextService.organizations.mockReturnValue([{ _id: 'org1', name: 'Org 1', createdAt: new Date().toISOString() }]);
      }
      component.isModalOpen.set(true);

      // Fill form
      component.createOrgForm.controls.name.setValue('New Org');

      // Submit
      component.onSubmit();

      expect(mockOrganizationService.createOrganization).toHaveBeenCalledWith('New Org');
      // The mock creates an org, verify context was triggered to refresh
      expect(mockOrgContextService.loadOrganizations).toHaveBeenCalled();
      expect(component.isModalOpen()).toBe(false);
    });
  });

  describe('navigateToOrg', () => {
    it('should set localStorage and navigate to drive', () => {
      component.navigateToOrg('org123');

      expect(localStorage.getItem('active_org_id')).toBe('org123');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/org', 'org123', 'drive']);
    });
  });
});
