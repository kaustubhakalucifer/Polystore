import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { PlatformRole, UserStatus } from 'src/core/enums';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  })
  email: string;

  @Prop({ select: false })
  passwordHash?: string;

  @Prop()
  firstName?: string;

  @Prop()
  lastName?: string;

  @Prop({ type: String, enum: PlatformRole, required: true })
  platformRole: PlatformRole;

  @Prop({ type: String, enum: UserStatus, default: UserStatus.PENDING })
  status: UserStatus;

  @Prop({ select: false })
  otpCode?: string;

  @Prop({ select: false })
  otpExpiresAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
