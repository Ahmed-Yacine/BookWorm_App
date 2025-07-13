import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserNotifications(userId: number, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [notifications, totalCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          fromUser: {
            select: {
              id: true,
              userName: true,
              firstName: true,
              lastName: true,
              picture: true,
            },
          },
        },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);
    return {
      notifications,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
    };
  }

  async markAsRead(userId: number, notificationIds?: number[]) {
    if (notificationIds && notificationIds.length > 0) {
      await this.prisma.notification.updateMany({
        where: { userId, id: { in: notificationIds } },
        data: { isRead: true },
      });
    } else {
      await this.prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
    }
    return { success: true };
  }

  async deleteNotifications(userId: number, notificationIds?: number[]) {
    if (notificationIds && notificationIds.length > 0) {
      await this.prisma.notification.deleteMany({
        where: { userId, id: { in: notificationIds } },
      });
    } else {
      await this.prisma.notification.deleteMany({ where: { userId } });
    }
    return { success: true };
  }

  // Notification creation helpers (for use in other services)
  async createLikeNotification(/*postId: number, fromUserId: number*/) {
    // ... move logic from PostService here ...
  }
  async createCommentNotification(/*postId: number, commentId: number, fromUserId: number, toUserId: number*/) {
    // ... move logic from CommentService here ...
  }
  async createCommentLikeNotification(/*postId: number, commentId: number, fromUserId: number, toUserId: number*/) {
    // ... move logic from CommentService here ...
  }
  async createFollowNotification(/*targetUserId: number, fromUserId: number*/) {
    // ... move logic from UserService here ...
  }
}
