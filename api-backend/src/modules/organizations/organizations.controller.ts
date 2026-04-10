import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedRequest } from '../../core/interfaces/authenticated-request.interface';
import { PlatformRole } from '../../core/enums';

@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(PlatformRole.TENANT_ADMIN)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  async createOrganization(
    @Body() dto: CreateOrganizationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.sub;
    return this.organizationsService.createOrganization(dto.name, userId);
  }

  @Get()
  async getOrganizations(@Req() req: AuthenticatedRequest) {
    const userId = req.user.sub;
    return this.organizationsService.getOrganizations(userId);
  }
}
