import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { OrganizationsService } from './organizations.service';
import { Organization } from './schemas/organization.schema';
import { OrganizationMembership } from './schemas/organization-membership.schema';
import { TenantRole, PlatformRole } from '../../core/enums';

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let membershipModel: { find: jest.Mock };

  const mockOrgSave = jest.fn();
  const mockMembershipSave = jest.fn();

  class MockOrgModel {
    name: string;
    tenantAdminId: string;
    cloudConfigurations: any[];
    _id: string;

    constructor(dto: Partial<Organization>) {
      this.name = dto.name || '';
      this.tenantAdminId = dto.tenantAdminId as string;
      this.cloudConfigurations = dto.cloudConfigurations || [];
      this._id = 'org-mock-id';
    }

    save = mockOrgSave;
    static db = {
      startSession: jest.fn().mockResolvedValue({
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn(),
      }),
    };
  }

  class MockMembershipModel {
    userId: string;
    organizationId: string;
    tenantRole: TenantRole;

    constructor(dto: Partial<OrganizationMembership>) {
      this.userId = dto.userId as string;
      this.organizationId = dto.organizationId as string;
      this.tenantRole = dto.tenantRole as TenantRole;
    }

    save = mockMembershipSave;
    static find = jest.fn();
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        {
          provide: getModelToken(Organization.name),
          useValue: MockOrgModel,
        },
        {
          provide: getModelToken(OrganizationMembership.name),
          useValue: MockMembershipModel,
        },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
    membershipModel = module.get(getModelToken(OrganizationMembership.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOrganization', () => {
    it('should create an organization and a membership', async () => {
      const name = 'Test Org';
      const userId = 'user123';
      const role = PlatformRole.TENANT_ADMIN;

      const mockCreatedOrg = {
        _id: 'org-mock-id',
        name,
        tenantAdminId: userId,
        cloudConfigurations: [],
      };

      mockOrgSave.mockResolvedValue(mockCreatedOrg);
      mockMembershipSave.mockResolvedValue(true);

      const result = await service.createOrganization(name, userId, role);

      expect(mockOrgSave).toHaveBeenCalled();
      expect(mockMembershipSave).toHaveBeenCalled();
      expect(result).toEqual(mockCreatedOrg);
    });
  });

  describe('getOrganizations', () => {
    it('should return organizations mapped from memberships with all fields mapped', async () => {
      const userId = 'user123';
      const role = PlatformRole.TENANT_ADMIN;
      const now = new Date();

      const mockPopulatedOrg = { 
        _id: 'org1', 
        name: 'Test Org',
        tenantAdminId: 'tenant123',
        createdAt: now,
        updatedAt: now,
        cloudConfigurations: ['config1', 'config2']
      };
      
      const expectedOrg = {
        _id: 'org1',
        name: 'Test Org',
        tenantAdminId: 'tenant123',
        createdAt: now,
        updatedAt: now,
        cloudProviderCount: 2,
      };
      
      const mockMemberships = [
        {
          userId,
          organizationId: mockPopulatedOrg,
          tenantRole: TenantRole.MANAGER,
        },
      ];

      const mockExec = jest.fn().mockResolvedValue(mockMemberships);
      const mockPopulate = jest.fn().mockReturnValue({ exec: mockExec });
      membershipModel.find.mockReturnValue({ populate: mockPopulate });

      const result = await service.getOrganizations(userId, role);

      expect(membershipModel.find).toHaveBeenCalledWith({ userId });
      expect(mockPopulate).toHaveBeenCalledWith('organizationId');
      expect(mockExec).toHaveBeenCalled();
      expect(result).toEqual([expectedOrg]);
    });

    it('should return organizations mapped from memberships (fallback fields)', async () => {
      const userId = 'user123';
      const role = PlatformRole.TENANT_ADMIN;

      const mockPopulatedOrg = { _id: 'org1', name: 'Test Org' };
      const expectedOrg = {
        _id: 'org1',
        name: 'Test Org',
        tenantAdminId: undefined,
        createdAt: undefined,
        updatedAt: undefined,
        cloudProviderCount: 0,
      };
      const mockMemberships = [
        {
          userId,
          organizationId: mockPopulatedOrg,
          tenantRole: TenantRole.MANAGER,
        },
      ];

      const mockExec = jest.fn().mockResolvedValue(mockMemberships);
      const mockPopulate = jest.fn().mockReturnValue({ exec: mockExec });
      membershipModel.find.mockReturnValue({ populate: mockPopulate });

      const result = await service.getOrganizations(userId, role);

      expect(membershipModel.find).toHaveBeenCalledWith({ userId });
      expect(mockPopulate).toHaveBeenCalledWith('organizationId');
      expect(mockExec).toHaveBeenCalled();
      expect(result).toEqual([expectedOrg]);
    });

    it('should filter out null organizations', async () => {
      const userId = 'user123';
      const role = PlatformRole.TENANT_ADMIN;
      const now = new Date();

      const mockPopulatedOrg = { 
        _id: 'org1', 
        name: 'Test Org',
        tenantAdminId: 'tenant123',
        createdAt: now,
        updatedAt: now,
        cloudConfigurations: ['config1', 'config2']
      };
      
      const expectedOrg = {
        _id: 'org1',
        name: 'Test Org',
        tenantAdminId: 'tenant123',
        createdAt: now,
        updatedAt: now,
        cloudProviderCount: 2,
      };
      const mockMemberships = [
        {
          userId,
          organizationId: mockPopulatedOrg,
          tenantRole: TenantRole.MANAGER,
        },
        { userId, organizationId: null, tenantRole: TenantRole.VIEWER },
      ];

      const mockExec = jest.fn().mockResolvedValue(mockMemberships);
      const mockPopulate = jest.fn().mockReturnValue({ exec: mockExec });
      membershipModel.find.mockReturnValue({ populate: mockPopulate });

      const result = await service.getOrganizations(userId, role);

      expect(result).toHaveLength(1);
      expect(result).toEqual([expectedOrg]);
    });
  });
});
