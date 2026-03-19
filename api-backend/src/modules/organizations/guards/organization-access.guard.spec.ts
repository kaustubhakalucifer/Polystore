import {
  BadRequestException,
  ForbiddenException,
  ExecutionContext,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { OrganizationAccessGuard } from './organization-access.guard';
import { OrganizationMembership } from '../schemas/organization-membership.schema';
import { TenantRole, PlatformRole } from '../../../core/enums';
import { OrganizationRequest } from '../interfaces/organization-request.interface';

describe('OrganizationAccessGuard', () => {
  let guard: OrganizationAccessGuard;
  let mockOrgMembershipModel: { findOne: jest.Mock };
  let mockExecutionContext: ExecutionContext;
  let mockRequest: Partial<OrganizationRequest>;

  beforeEach(async () => {
    // Mock the Mongoose Model
    mockOrgMembershipModel = {
      findOne: jest.fn(),
    };

    // Setup the module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationAccessGuard,
        {
          provide: getModelToken(OrganizationMembership.name),
          useValue: mockOrgMembershipModel,
        },
      ],
    }).compile();

    guard = module.get<OrganizationAccessGuard>(OrganizationAccessGuard);

    // Setup a mock request
    mockRequest = {
      headers: {},
      user: {
        sub: 'userId-123',
        email: 'test@example.com',
        platformRole: PlatformRole.USER,
      },
      organizationContext: undefined,
    };

    // Setup a mock execution context
    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as unknown as ExecutionContext;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should throw BadRequestException if x-organization-id header is missing', async () => {
      // Missing header scenario
      mockRequest.headers = {};

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        BadRequestException,
      );
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        'x-organization-id header is required',
      );
    });

    it('should throw ForbiddenException if user has no membership record for the org', async () => {
      mockRequest.headers = { 'x-organization-id': 'orgId-456' };

      // Mock database returning null (no membership found)
      mockOrgMembershipModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        'You do not have access to this organization',
      );

      // Verify correct query was sent to db
      expect(mockOrgMembershipModel.findOne).toHaveBeenCalledWith({
        userId: 'userId-123',
        organizationId: 'orgId-456',
      });
    });

    it('should pass and correctly inject organizationContext if membership exists', async () => {
      mockRequest.headers = { 'x-organization-id': 'orgId-456' };

      // Mock database returning a valid membership record
      const mockMembership = {
        userId: 'userId-123',
        organizationId: 'orgId-456',
        tenantRole: TenantRole.MANAGER,
      };

      mockOrgMembershipModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockMembership),
      });

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockRequest.organizationContext).toBeDefined();
      expect(mockRequest.organizationContext).toEqual({
        organizationId: 'orgId-456',
        tenantRole: TenantRole.MANAGER,
      });

      // Verify correct query was sent to db
      expect(mockOrgMembershipModel.findOne).toHaveBeenCalledWith({
        userId: 'userId-123',
        organizationId: 'orgId-456',
      });
    });
  });
});
