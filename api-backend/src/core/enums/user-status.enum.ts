/**
 * @description User status enum
 * UNVERIFIED - User has registered but not verified OTP
 * PENDING - User is either registered / invited but not yet activated
 * ACTIVE - User is active
 * REJECTED - User is rejected
 * INACTIVE - User is inactive
 */
export enum UserStatus {
  UNVERIFIED = 'UNVERIFIED',
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  REJECTED = 'REJECTED',
  INACTIVE = 'INACTIVE',
}
