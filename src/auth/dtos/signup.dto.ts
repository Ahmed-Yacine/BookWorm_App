import {
  IsEmail,
  IsString,
  IsNotEmpty,
  IsOptional,
  MinLength,
} from 'class-validator';
import { MatchDecorator } from '../../common/decorators/match.decorator';

export class SignupDto {
  @IsOptional()
  @IsString()
  userName: string;

  @IsString()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  // here we can use regex to validate password strength with Matches decorator
  password: string;

  @IsNotEmpty()
  @MatchDecorator('password', {
    message: 'from Dto Passwords do not match',
  })
  confirmPassword: string;
}
