import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { UsersSeederService } from './users-seeder.service';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [UsersSeederService, UsersRepository, UsersService],
  exports: [UsersSeederService, UsersService, MongooseModule],
})
export class UsersModule {}
