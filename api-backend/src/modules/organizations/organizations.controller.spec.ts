import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../core/interfaces/authenticated-request.interface';
import { PlatformRole } from '../../core/enums';

describe('OrganizationsController', () => {
  let controller: OrganizationsController;

  const mockOrganizationsService = {
    createOrganization: jest.fn(),
    getOrganizations: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationsController],
      providers: [
        {
          provide: OrganizationsService,
          useValue: mockOrganizationsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: () => {
          return true;
        },
      })
      .compile();

    controller = module.get<OrganizationsController>(OrganizationsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createOrganization', () => {
    it('should create an organization and return it', async () => {
      const dto: CreateOrganizationDto = { name: 'Test Org' };
      const req = {
        user: {
          sub: 'user123',
          email: 'test@example.com',
          role: PlatformRole.TENANT_ADMIN,
        },
      } as unknown as AuthenticatedRequest;

      const expectedResult = {
        _id: 'org123',
        name: 'Test Org',
        tenantAdminId: 'user123',
      };
      mockOrganizationsService.createOrganization.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.createOrganization(dto, req);

      expect(mockOrganizationsService.createOrganization).toHaveBeenCalledWith(
        'Test Org',
        'user123',
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getOrganizations', () => {
    it('should return an array of organizations for the user', async () => {
      const req = {
        user: {
          sub: 'user123',
          email: 'test@example.com',
          role: PlatformRole.TENANT_ADMIN,
        },
      } as unknown as AuthenticatedRequest;

      const expectedResult = [
        { _id: 'org1', name: 'Org 1' },
        { _id: 'org2', name: 'Org 2' },
      ];
      mockOrganizationsService.getOrganizations.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.getOrganizations(req);

      expect(mockOrganizationsService.getOrganizations).toHaveBeenCalledWith(
        'user123',
      );
      expect(result).toEqual(expectedResult);
    });
  });
});
