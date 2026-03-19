import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { AdminUsersController } from './admin-users.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [UsersModule, AuthModule],
  controllers: [AdminUsersController],
  providers: [AdminService],
})
export class AdminModule {}
