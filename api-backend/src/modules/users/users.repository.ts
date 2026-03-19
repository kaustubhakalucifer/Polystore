import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: String(email) }).exec();
  }

  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: String(email) })
      .select('+passwordHash')
      .exec();
  }

  async findByStatus(status: string): Promise<UserDocument[]> {
    return this.userModel.find({ status }).exec();
  }

  async updateStatus(id: string, status: string): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(id, { status }, { returnDocument: 'after' })
      .exec();
  }
}
