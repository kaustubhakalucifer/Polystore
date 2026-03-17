/**
 * @description User status enum
 * PENDING - User is either registered / invited but not yet activated
 * ACTIVE - User is active
 * REJECTED - User is rejected
 * INACTIVE - User is inactive
 */
export enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  REJECTED = 'REJECTED',
  INACTIVE = 'INACTIVE',
}
