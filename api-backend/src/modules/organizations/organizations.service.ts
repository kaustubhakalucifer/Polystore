import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Organization,
  OrganizationDocument,
} from './schemas/organization.schema';
import {
  OrganizationMembership,
  OrganizationMembershipDocument,
} from './schemas/organization-membership.schema';
import { TenantRole, PlatformRole } from '../../core/enums';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectModel(Organization.name)
    private orgModel: Model<OrganizationDocument>,
    @InjectModel(OrganizationMembership.name)
    private membershipModel: Model<OrganizationMembershipDocument>,
  ) {}

  async createOrganization(name: string, userId: string, role: string) {
    if (role !== (PlatformRole.TENANT_ADMIN as string)) {
      throw new ForbiddenException(
        'Only tenant admins can create organizations',
      );
    }

    const session = await this.orgModel.db.startSession();
    session.startTransaction();

    try {
      const org = new this.orgModel({
        name,
        tenantAdminId: userId,
        cloudConfigurations: [],
      });

      const savedOrg = await org.save({ session });

      const membership = new this.membershipModel({
        userId,
        organizationId: savedOrg._id,
        tenantRole: TenantRole.OWNER,
      });

      await membership.save({ session });

      await session.commitTransaction();
      return savedOrg;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async getOrganizations(userId: string, role: string) {
    if (role !== (PlatformRole.TENANT_ADMIN as string)) {
      throw new ForbiddenException('Only tenant admins can view organizations');
    }

    const memberships = await this.membershipModel
      .find({ userId })
      .populate<{ organizationId: OrganizationDocument }>('organizationId')
      .exec();

    // Map the memberships to return safe organization documents.
    // Ensure we handle cases where organizationId might be a populated object or missing.
    const organizations = memberships
      .map((m) => m.organizationId)
      .filter((org) => org != null)
      .map((org) => {
        const obj = (
          org.toObject ? org.toObject() : org
        ) as OrganizationDocument & { createdAt?: Date; updatedAt?: Date };
        return {
          _id: obj._id,
          name: obj.name,
          tenantAdminId: obj.tenantAdminId,
          createdAt: obj.createdAt,
          updatedAt: obj.updatedAt,
          cloudProviderCount: obj.cloudConfigurations?.length || 0,
        };
      });

    return organizations;
  }
}
