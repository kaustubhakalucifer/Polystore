import { IsEnum, IsOptional } from 'class-validator';
import { UserStatus } from '../../../core/enums';

export class GetUsersQueryDto {
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
