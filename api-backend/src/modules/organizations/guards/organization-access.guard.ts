import {
  CanActivate,
  ExecutionContext,
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  OrganizationMembership,
  OrganizationMembershipDocument,
} from '../schemas/organization-membership.schema';
import { OrganizationRequest } from '../interfaces/organization-request.interface';

@Injectable()
export class OrganizationAccessGuard implements CanActivate {
  constructor(
    @InjectModel(OrganizationMembership.name)
    private readonly orgMembershipModel: Model<OrganizationMembershipDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<OrganizationRequest>();

    // Extract x-organization-id header
    const orgIdHeader = request.headers['x-organization-id'];

    if (!orgIdHeader) {
      throw new BadRequestException('x-organization-id header is required');
    }

    if (Array.isArray(orgIdHeader)) {
      throw new BadRequestException(
        'x-organization-id header must be a single string',
      );
    }

    const organizationId = orgIdHeader.trim();

    if (!organizationId) {
      throw new BadRequestException('x-organization-id header cannot be empty');
    }

    if (!Types.ObjectId.isValid(organizationId)) {
      throw new BadRequestException(
        'x-organization-id header must be a valid ObjectId',
      );
    }

    // AuthGuard runs before this guard, so req.user should be populated
    if (!request.user || !request.user.sub) {
      throw new ForbiddenException('User authentication required');
    }

    const userId = request.user.sub;

    // Verify membership record for the user and organization
    const membership = await this.orgMembershipModel
      .findOne({
        userId,
        organizationId,
      })
      .exec();

    if (!membership) {
      throw new ForbiddenException(
        'You do not have access to this organization',
      );
    }

    // Inject the organization context into the request object
    request.organizationContext = {
      organizationId,
      tenantRole: membership.tenantRole,
    };

    return true;
  }
}
