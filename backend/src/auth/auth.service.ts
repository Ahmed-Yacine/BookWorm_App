import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import generateTokens from '../common/jwt/generateTokens';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto } from './dtos/signup.dto';
import { JwtPayload } from '../common/jwt/jwt.payload';
import { JwtService } from '@nestjs/jwt';
import { SigninDto } from './dtos/signin.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { changePasswordDto } from './dtos/changePassword.dto';
import { ResetPasswordDto } from './dtos/resetPassword.dto';
import { VerifyCodeDto } from './dtos/verificationCode.dto';
import { ChangePasswordForLoggedInUserDto } from './dtos/ChanPassForLogged.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
  ) {}

  public async validateUser(email: string, password: string) {
    const user = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid credentials');
    }

    return user;
  }

  public async signup(signupDto: SignupDto) {
    const { userName, email, firstName, lastName, password, confirmPassword } =
      signupDto;

    // Check if passwords match
    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    // Check if userName or email already exists
    const existingUser = await this.prismaService.user.findFirst({
      where: {
        OR: [{ userName }, { email }],
      },
    });

    if (existingUser) {
      if (existingUser.userName === userName) {
        throw new ConflictException('Username is already taken');
      }
      if (existingUser.email === email) {
        throw new ConflictException('Email is already registered');
      }
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const user = await this.prismaService.user.create({
      data: {
        userName,
        email,
        firstName,
        lastName,
        password: hashedPassword,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user;
    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
    };

    const tokens = generateTokens(this.jwtService, payload);
    return {
      user: result,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  public async signin(signInDto: SigninDto) {
    const { email, password } = signInDto;

    const user = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid credentials');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user;
    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
    };

    const tokens = generateTokens(this.jwtService, payload);
    return {
      user: result,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  public async signout(userId: number) {
    return { message: `User with ID ${userId} signed out successfully` };
  }

  public async refreshToken(refreshToken: string) {
    // Validate that refresh token is provided
    if (!refreshToken || refreshToken.trim() === '') {
      throw new UnauthorizedException('Refresh token is required');
    }

    try {
      // Verify the refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      // Check if it's actually a refresh token
      if (!payload || payload.countEx <= 0) {
        throw new UnauthorizedException(
          'Invalid refresh token , please go to login',
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { exp, ...newpayload } = payload; // Exclude exp from payload

      const newpayloadaccess: JwtPayload = {
        id: newpayload.sub,
        email: newpayload.email,
      };

      const accessToken = this.jwtService.sign(newpayloadaccess, {
        secret: process.env.JWT_SECRET,
      });

      const refresh_Token = this.jwtService.sign(
        {
          ...newpayload,
          countEx: newpayload.countEx - 1, // Decrement the count
        },
        {
          secret: process.env.JWT_REFRESH_SECRET,
          // You can set a longer expiration for refresh tokens
        },
      );

      return {
        message: 'Tokens refreshed successfully',
        accessToken,
        refresh_Token,
      };
    } catch (error) {
      // Handle specific JWT errors
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException(
          'Invalid refresh token: ' + error.message,
        );
      }
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Refresh token expired');
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  public async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.prismaService.user.findUnique({
      where: { email: resetPasswordDto.email },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // create code of 6 digits
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    if (!resetCode) {
      throw new BadRequestException('Failed to generate reset code');
    }
    await this.prismaService.user.update({
      where: { email: resetPasswordDto.email },
      data: { verificationCode: resetCode },
    });

    // send code to user email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  background-color: #f4f4f4;
                  margin: 0;
                  padding: 0;
              }
              .container {
                  max-width: 600px;
                  margin: 20px auto;
                  background-color: #ffffff;
                  padding: 20px;
                  border-radius: 8px;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .header {
                  color: #333333;
                  text-align: center;
                  padding-bottom: 20px;
                  border-bottom: 1px solid #dddddd;
              }
              .content {
                  padding: 20px 0;
              }
              .code {
                  font-size: 24px;
                  font-weight: bold;
                  text-align: center;
                  padding: 12px;
                  background-color: #f2f2f2;
                  border: 1px dashed #cccccc;
                  margin: 20px 0;
                  color: #333;
              }
              .footer {
                  text-align: center;
                  font-size: 12px;
                  color: #777777;
                  padding-top: 20px;
                  border-top: 1px solid #dddddd;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h2>Password Reset Request</h2>
              </div>
              <div class="content">
                  <p>Hello There ,</p>
                  <p>You requested a password reset. Please use the following verification code to reset your password:</p>
                  <div class="code">${resetCode}</div>
                  <p>This code will expire in 10 minutes.</p>
                  <p>If you did not request a password reset, you can safely ignore this email.</p>
              </div>
              <div class="footer">
                  <p>Thank you for using our application!</p>
              </div>
          </div>
      </body>
      </html>`;

    this.sendMail(emailHtml, resetPasswordDto.email, `Password Reset Code`);
    // Return the reset code (or a success message)
    return {
      message: `code sent successfully to your email ${resetPasswordDto.email}`,
    };
  }

  public async verifyCode(verifyCodeDto: VerifyCodeDto) {
    const user = await this.prismaService.user.findUnique({
      where: { email: verifyCodeDto.email },
      select: { verificationCode: true },
    });

    if (!user) {
      throw new NotFoundException('User Not Found');
    }

    if (user.verificationCode !== verifyCodeDto.code) {
      throw new UnauthorizedException('Invalid code');
    }

    // Clear the verification code after successful verification
    await this.prismaService.user.update({
      where: { email: verifyCodeDto.email },
      data: { verificationCode: null },
    });

    return {
      message: 'Code verified successfully, you can now change your password',
    };
  }

  public async changePassword(changePasswordDto: changePasswordDto) {
    const user = await this.prismaService.user.findUnique({
      where: { email: changePasswordDto.email },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const password = bcrypt.hashSync(changePasswordDto.password, 10);

    const updatedUser = await this.prismaService.user.update({
      where: { email: changePasswordDto.email },
      data: { password },
    });

    if (!updatedUser) {
      throw new BadRequestException('Failed to change password');
    }

    return {
      message: 'Password changed successfully, please login again',
    };
  }

  public async changePasswordForLoggedInUser(
    ChangePasswordForLoggedInUserDto: ChangePasswordForLoggedInUserDto,
  ) {
    const { userId, currentPassword, newPassword, confirmPassword } =
      ChangePasswordForLoggedInUserDto;

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Check if old password is correct
    const isOldPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isOldPasswordValid) {
      throw new UnauthorizedException('current password is incorrect');
    }

    // Hash the new password
    const hashedNewPassword = bcrypt.hashSync(newPassword, 10);

    // Update the user's password
    await this.prismaService.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    return { message: 'Password changed successfully' };
  }

  private sendMail(htmlMsg: string, to: string, subject: string) {
    this.mailerService.sendMail({
      from: `BookWorm_App <${process.env.MAIL_USER}>`,
      to: to,
      subject: subject,
      html: htmlMsg,
    });
  }
}
