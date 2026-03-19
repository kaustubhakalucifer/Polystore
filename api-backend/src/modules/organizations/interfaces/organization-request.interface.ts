import { Request } from 'express';
import { TenantRole, PlatformRole } from '../../../core/enums';

export interface OrganizationContext {
  organizationId: string;
  tenantRole: TenantRole;
}

export interface OrganizationRequest extends Request {
  user: {
    sub: string;
    email: string;
    role: PlatformRole;
  };
  organizationContext?: OrganizationContext;
}
