import { UserStatus } from '../enums/user-status.enum';
import { PlatformRole } from '../enums/platform-role.enum';

export interface User {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  status: UserStatus;
  platformRole: PlatformRole;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationQueryDto {
  page?: number;
  limit?: number;
  status?: UserStatus;
  search?: string;
}
