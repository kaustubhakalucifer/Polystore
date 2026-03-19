import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { AdminUsersController } from './admin-users.controller';

@Module({
  imports: [UsersModule, AuthModule],
  controllers: [AdminUsersController],
})
export class AdminModule {}
