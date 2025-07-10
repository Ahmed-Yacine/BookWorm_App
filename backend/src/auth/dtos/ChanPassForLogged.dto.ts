import { IsInt, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Match } from '../../common/decorators/match.decorator';

export class ChangePasswordForLoggedInUserDto {
  @IsNotEmpty()
  @IsInt()
  userId: number;

  @IsNotEmpty()
  @IsString()
  currentPassword: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  newPassword: string;

  @IsNotEmpty()
  @Match('newPassword', {
    message: 'from Dto Passwords do not match',
  })
  confirmPassword: string;
}
