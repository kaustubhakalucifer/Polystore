import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { OrganizationRequest } from '../interfaces/organization-request.interface';

/**
 * Custom decorator to extract the organization context from the request object.
 * It returns the context injected by the OrganizationAccessGuard.
 * Returns { organizationId, tenantRole }.
 */
export const CurrentOrganization = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<OrganizationRequest>();
    return request.organizationContext;
  },
);
