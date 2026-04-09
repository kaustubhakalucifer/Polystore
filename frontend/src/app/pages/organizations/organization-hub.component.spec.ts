import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrganizationHubComponent } from './organization-hub.component';
import { OrganizationService } from './organization.service';
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
  let mockRouter: {
    navigate: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockOrganizationService = {
      getOrganizations: vi.fn().mockReturnValue(of({ data: [] })),
      createOrganization: vi.fn().mockReturnValue(of({ data: { _id: 'new1', name: 'New Org' } })),
    };

    mockRouter = {
      navigate: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [OrganizationHubComponent],
      providers: [
        { provide: OrganizationService, useValue: mockOrganizationService },
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

      expect(mockOrganizationService.getOrganizations).toHaveBeenCalled();
      expect(component.organizations()).toEqual(mockOrgs);
      expect(component.isLoading()).toBe(false);
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

    it('should call service, update organizations, and close modal on valid submit', () => {
      // Set initial state
      component.organizations.set([{ _id: 'org1', name: 'Org 1', createdAt: new Date().toISOString() }]);
      component.isModalOpen.set(true);

      // Fill form
      component.createOrgForm.controls.name.setValue('New Org');

      // Submit
      component.onSubmit();

      expect(mockOrganizationService.createOrganization).toHaveBeenCalledWith('New Org');
      // The mock returns an org with _id 'new1'
      expect(component.organizations().length).toBe(2);
      expect(component.organizations()[1]._id).toBe('new1');
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
