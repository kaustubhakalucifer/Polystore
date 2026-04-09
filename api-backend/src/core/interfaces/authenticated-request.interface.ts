import { Request } from 'express';
import { PlatformRole } from '../enums';

export interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    email: string;
    role: PlatformRole;
  };
}
