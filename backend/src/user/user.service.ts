import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dtos/update-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  public async getProfile(id: number) {
    const user = await this.prismaService.user.findUnique({
      where: { id },
    });
    if (!user) return null;
    // Exclude password from the returned user object
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  public async updateProfile(id: number, updateUserDto: UpdateUserDto) {
    if ('password' in updateUserDto) {
      throw new Error(
        'To update your password, please use the change password endpoint.',
      );
    }
    return this.prismaService.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  public async deleteProfile(id: number) {
    return this.prismaService.user.delete({
      where: { id },
    });
  }

  // UserService methods for follow/unfollow functionality

  public async toggleFollow(currentUserId: number, targetUserId: number) {
    // Validate inputs
    if (!currentUserId || !targetUserId) {
      throw new BadRequestException('Invalid user IDs provided');
    }

    // Prevent self-following/unfollowing
    if (currentUserId === targetUserId) {
      throw new BadRequestException('You cannot follow or unfollow yourself');
    }

    // Check if users exist
    const [currentUser, targetUser] = await Promise.all([
      this.prismaService.user.findUnique({ where: { id: currentUserId } }),
      this.prismaService.user.findUnique({ where: { id: targetUserId } }),
    ]);

    if (!currentUser) throw new BadRequestException('Current user not found');
    if (!targetUser) throw new BadRequestException('Target user not found');

    // Check if already following
    const existingFollow = await this.prismaService.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      },
    });

    if (existingFollow) {
      // Unfollow
      await this.prismaService.follows.delete({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: targetUserId,
          },
        },
      });
      return { followed: false };
    } else {
      // Follow
      const newFollow = await this.prismaService.follows.create({
        data: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
        include: {
          following: {
            select: {
              id: true,
              userName: true,
              firstName: true,
              lastName: true,
              picture: true,
            },
          },
        },
      });
      // Create notification
      await this.createFollowNotification(targetUserId, currentUserId);
      return { followed: true, data: newFollow };
    }
  }

  public async unfollowUser(currentUserId: number, targetUserId: number) {
    // Prevent self-unfollowing
    if (currentUserId === targetUserId) {
      throw new BadRequestException('You cannot unfollow yourself');
    }

    // Check if target user exists
    const targetUser = await this.prismaService.user.findUnique({
      where: { id: targetUserId },
    });
    if (!targetUser) {
      throw new BadRequestException('Target user not found');
    }

    // Check if currently following
    const existingFollow = await this.prismaService.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      },
    });

    if (!existingFollow) {
      throw new BadRequestException('You are not following this user');
    }

    // Remove the follow relationship
    await this.prismaService.follows.delete({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      },
    });

    return { success: true };
  }

  // Updated helper methods
  public async isFollowing(
    currentUserId: number,
    targetUserId: number,
  ): Promise<boolean> {
    const follow = await this.prismaService.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      },
    });
    return !!follow;
  }

  public async getFollowers(userId: number) {
    return this.prismaService.user.findUnique({
      where: { id: userId },
      include: {
        followers: {
          include: {
            follower: {
              select: {
                id: true,
                userName: true,
                firstName: true,
                lastName: true,
                picture: true,
              },
            },
          },
        },
      },
    });
  }

  public async getFollowing(userId: number) {
    return this.prismaService.user.findUnique({
      where: { id: userId },
      include: {
        following: {
          include: {
            following: {
              select: {
                id: true,
                userName: true,
                firstName: true,
                lastName: true,
                picture: true,
              },
            },
          },
        },
      },
    });
  }

  public async getFollowCounts(userId: number) {
    const [followersCount, followingCount] = await Promise.all([
      this.prismaService.follows.count({ where: { followingId: userId } }),
      this.prismaService.follows.count({ where: { followerId: userId } }),
    ]);

    return {
      followersCount,
      followingCount,
    };
  }

  // Notification helper remains the same
  private async createFollowNotification(
    targetUserId: number,
    fromUserId: number,
  ) {
    try {
      const fromUser = await this.prismaService.user.findUnique({
        where: { id: fromUserId },
        select: { firstName: true, lastName: true, userName: true },
      });

      if (fromUser) {
        const displayName =
          fromUser.userName || `${fromUser.firstName} ${fromUser.lastName}`;
        await this.prismaService.notification.create({
          data: {
            userId: targetUserId,
            type: 'FOLLOW',
            content: `${displayName} started following you`,
            fromUserId: fromUserId,
          },
        });
      }
    } catch (error) {
      console.error('Error creating follow notification:', error);
    }
  }
}
