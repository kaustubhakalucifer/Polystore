import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { PaginatedResult } from '../../core/interfaces/paginated.interface';
import { UserStatus } from '../../core/enums';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async getUsers(query: PaginationQueryDto): Promise<PaginatedResult<User>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const status = query.status;

    const filters: Record<string, string> = {};
    if (status) {
      filters.status = status;
    } else {
      filters.status = UserStatus.PENDING;
    }

    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      this.userModel.countDocuments(filters).exec(),
      this.userModel
        .find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }
}
