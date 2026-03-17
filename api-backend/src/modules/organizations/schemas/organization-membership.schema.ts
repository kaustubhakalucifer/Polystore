import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from 'src/modules/users/schemas/user.schema';
import { Organization } from './organization.schema';
import { TenantRole } from 'src/core/enums';

export type OrganizationMembershipDocument = OrganizationMembership & Document;

@Schema({ timestamps: true })
export class OrganizationMembership {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: User | string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  })
  organizationId: Organization | string;

  @Prop({ type: String, enum: TenantRole, required: true })
  tenantRole: TenantRole;
}

export const OrganizationMembershipSchema = SchemaFactory.createForClass(
  OrganizationMembership,
);

OrganizationMembershipSchema.index(
  { userId: 1, organizationId: 1 },
  { unique: true },
);
