import { Injectable } from '@nestjs/common';
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
import { TenantRole } from '../../core/enums';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectModel(Organization.name)
    private orgModel: Model<OrganizationDocument>,
    @InjectModel(OrganizationMembership.name)
    private membershipModel: Model<OrganizationMembershipDocument>,
  ) {}

  async createOrganization(name: string, userId: string) {
    const org = new this.orgModel({
      name,
      tenantAdminId: userId,
      cloudConfigurations: [],
    });

    const savedOrg = await org.save();

    const membership = new this.membershipModel({
      userId,
      organizationId: savedOrg._id,
      tenantRole: TenantRole.MANAGER,
    });

    await membership.save();

    return savedOrg;
  }

  async getOrganizations(userId: string) {
    const memberships = await this.membershipModel
      .find({ userId })
      .populate('organizationId')
      .exec();

    // Map the memberships to return the populated organization documents.
    // Ensure we handle cases where organizationId might be a populated object or missing.
    const organizations = memberships
      .map((m) => m.organizationId)
      .filter((org) => org != null);

    return organizations;
  }
}
