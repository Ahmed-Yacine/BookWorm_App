import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dtos/signup.dto';
import { SigninDto } from './dtos/signin.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { changePasswordDto } from './dtos/changePassword.dto';
import { ResetPasswordDto } from './dtos/resetPassword.dto';
import { VerifyCodeDto } from './dtos/verificationCode.dto';
import { ChangePasswordForLoggedInUserDto } from './dtos/ChanPassForLogged.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post('signup')
  public async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @Post('signin')
  public async signin(@Body() signInDto: SigninDto) {
    return this.authService.signin(signInDto);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Post('signout')
  public async signout(@Req() req: any) {
    return this.authService.signout(req.user.id);
  }

  @HttpCode(HttpStatus.OK)
  @Post('refreshToken/:refresh_token')
  public async refreshToken(@Param('refresh_token') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  @Post('reset-password')
  public async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('verify-code')
  public async verifyCode(@Body() VerifyCodeDto: VerifyCodeDto) {
    return this.authService.verifyCode(VerifyCodeDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('change-password')
  public async changePassword(@Body() changePasswordDto: changePasswordDto) {
    return this.authService.changePassword(changePasswordDto);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Post('change-password-for-logged-in-user')
  public async changePasswordForLoggedInUser(
    @Body() ChangePasswordForLoggedInUserDto: ChangePasswordForLoggedInUserDto,
  ) {
    return this.authService.changePasswordForLoggedInUser(
      ChangePasswordForLoggedInUserDto,
    );
  }
}
