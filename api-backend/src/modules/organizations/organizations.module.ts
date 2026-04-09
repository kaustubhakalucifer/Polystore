import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import {
  Organization,
  OrganizationSchema,
} from './schemas/organization.schema';
import {
  OrganizationMembership,
  OrganizationMembershipSchema,
} from './schemas/organization-membership.schema';
import { AuthModule } from '../auth/auth.module';
import { ConfigModule } from '../../config/config.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Organization.name, schema: OrganizationSchema },
      {
        name: OrganizationMembership.name,
        schema: OrganizationMembershipSchema,
      },
    ]),
    AuthModule,
    ConfigModule,
  ],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService, MongooseModule],
})
export class OrganizationsModule {}
