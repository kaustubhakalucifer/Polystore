/**
 * @description Tenant role enum
 * OWNER - Full billing and credential access
 * MANAGER - Can upload / delete / rename files
 * VIEWER - Can only view / download files
 */
export enum TenantRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  VIEWER = 'VIEWER',
}
