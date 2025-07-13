import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  UseGuards,
  Param,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dtos/update-user.dto';
import { BadRequestException } from '@nestjs/common';
import { AuthGuard } from './guards/auth.guard';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @Get('profile')
  public getProfile(@Req() req: any) {
    return this.userService.getProfile(req.user.id);
  }

  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(AuthGuard)
  @Patch('update_profile')
  public async updateProfile(
    @Req() req: any,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    try {
      const updatedUser = await this.userService.updateProfile(
        req.user.id,
        updateUserDto,
      );
      // Exclude password from the returned user object
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userWithoutPassword } = updatedUser;
      return userWithoutPassword;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AuthGuard)
  @Delete('delete_profile')
  public async deleteProfile(@Req() req: any) {
    await this.userService.deleteProfile(req.user.id);
    return;
  }

  // UserController methods for follow/unfollow functionality

  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @Post('toggle-follow/:targetUserId')
  public async toggleFollowUser(
    @Req() req: any,
    @Param('targetUserId', ParseIntPipe) targetUserId: number,
  ) {
    try {
      if (!req.user?.id) {
        throw new BadRequestException('User not authenticated properly');
      }
      const currentUserId = parseInt(req.user.id);
      if (isNaN(currentUserId)) {
        throw new BadRequestException('Invalid user ID in token');
      }
      const result = await this.userService.toggleFollow(
        currentUserId,
        targetUserId,
      );
      return {
        message: result.followed
          ? 'User followed successfully'
          : 'User unfollowed successfully',
        data: result.data || null,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @Get('is-following/:targetUserId')
  public async isFollowing(
    @Request() req: any,
    @Param('targetUserId', ParseIntPipe) targetUserId: number,
  ) {
    try {
      const isFollowing = await this.userService.isFollowing(
        req.user.id,
        targetUserId,
      );
      return {
        isFollowing,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @Get('followers/:userId')
  public async getFollowers(@Param('userId', ParseIntPipe) userId: number) {
    try {
      const result = await this.userService.getFollowing(userId);
      return {
        followers: result?.following || [],
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @Get('following/:userId')
  public async getFollowing(@Param('userId', ParseIntPipe) userId: number) {
    try {
      const result = await this.userService.getFollowers(userId);
      return {
        following: result?.followers || [],
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @Get('follow-counts/:userId')
  public async getFollowCounts(@Param('userId', ParseIntPipe) userId: number) {
    try {
      const counts = await this.userService.getFollowCounts(userId);
      return counts;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
