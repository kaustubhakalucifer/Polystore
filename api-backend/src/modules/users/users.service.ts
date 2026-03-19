import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.usersRepository.findByEmail(email);
  }

  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.usersRepository.findByEmailWithPassword(email);
  }

  async findWaitlistedUsers(status: string): Promise<UserDocument[]> {
    return this.usersRepository.findByStatus(status);
  }

  async updateUserStatus(
    id: string,
    status: string,
  ): Promise<UserDocument | null> {
    return this.usersRepository.updateStatus(id, status);
  }
}
