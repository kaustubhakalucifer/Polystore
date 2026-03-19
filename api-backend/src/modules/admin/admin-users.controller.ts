import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PlatformRole, UserStatus } from '../../core/enums';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { UserIdParamDto } from './dto/user-id-param.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(PlatformRole.SUPER_ADMIN)
export class AdminUsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly adminService: AdminService,
  ) {}

  @Get()
  async getUsers(@Query() query: PaginationQueryDto) {
    return this.adminService.getUsers(query);
  }

  @Get('waitlisted')
  async getWaitlistedUsers(@Query() query: GetUsersQueryDto) {
    const status = query.status || UserStatus.PENDING;
    return this.usersService.findWaitlistedUsers(status);
  }

  @Patch(':id/approve')
  async approveUser(@Param() params: UserIdParamDto) {
    const user = await this.usersService.updateUserStatus(
      params.id,
      UserStatus.ACTIVE,
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @Patch(':id/reject')
  async rejectUser(@Param() params: UserIdParamDto) {
    const user = await this.usersService.updateUserStatus(
      params.id,
      UserStatus.REJECTED,
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
