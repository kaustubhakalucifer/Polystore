import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { CloudProvider } from 'src/core/enums';
import { User } from 'src/modules/users/schemas/user.schema';

@Schema({ _id: false })
class CloudConfiguration {
  @Prop({ type: String, enum: CloudProvider, required: true })
  provider: CloudProvider;

  @Prop({ required: true })
  bucketName: string;

  @Prop({ default: false })
  isPrimary: boolean;

  @Prop({ required: true })
  encryptedAccessKey: string;

  @Prop({ required: true })
  encryptedSecretKey: string;
}

const CloudConfigurationSchema =
  SchemaFactory.createForClass(CloudConfiguration);

export type OrganizationDocument = Organization & Document;

@Schema({ timestamps: true })
export class Organization {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  tenantAdminId: User | string;

  @Prop({ type: [CloudConfigurationSchema], default: [] })
  cloudConfigurations: CloudConfiguration[];
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);
