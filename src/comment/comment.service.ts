import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCommentDto } from './dtos/create-comment.dto';
import { CommentResponseDto } from '../post/dtos/post-response.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class CommentService {
  constructor(private readonly prismaService: PrismaService) {}

  public async getComments(postId: number, userId?: number) {
    // Fetch all comments for the given postId
    const comments = await this.prismaService.comment.findMany({
      where: { postId },
      include: {
        user: {
          select: {
            id: true,
            userName: true,
            firstName: true,
            lastName: true,
            picture: true,
          },
        },
        _count: {
          select: { likes: true },
        },
        likes: userId
          ? {
              where: { userId },
              select: { id: true },
            }
          : false,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform to DTOs
    return comments.map((comment) =>
      plainToInstance(
        CommentResponseDto,
        {
          ...comment,
          likesCount: comment._count.likes,
          isLiked: userId ? comment.likes && comment.likes.length > 0 : false,
        },
        { excludeExtraneousValues: true },
      ),
    );
  }

  public async createComment(
    postId: number,
    createCommentDto: CreateCommentDto,
    userId: number,
  ) {
    // Check if the post exists
    const post = await this.prismaService.post.findUnique({
      where: { id: postId },
      include: { user: true },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Create the comment
    const comment = await this.prismaService.comment.create({
      data: {
        postId,
        userId,
        content: createCommentDto.content,
      },
      include: {
        user: {
          select: {
            id: true,
            userName: true,
            firstName: true,
            lastName: true,
            picture: true,
          },
        },
        _count: {
          select: { likes: true },
        },
        likes: false,
      },
    });

    // Send notification to post owner (unless commenter is the owner)
    if (post.userId !== userId) {
      const fromUser = await this.prismaService.user.findUnique({
        where: { id: userId },
        select: { userName: true, firstName: true, lastName: true },
      });
      const displayName =
        fromUser.userName || `${fromUser.firstName} ${fromUser.lastName}`;
      await this.prismaService.notification.create({
        data: {
          userId: post.userId,
          type: 'COMMENT',
          content: `${displayName} commented on your post`,
          fromUserId: userId,
          postId: postId,
          commentId: comment.id,
        },
      });
    }

    // Transform to DTO
    return plainToInstance(
      CommentResponseDto,
      {
        ...comment,
        likesCount: comment._count.likes,
        isLiked: false, // You can implement logic to check if the current user liked this comment
      },
      { excludeExtraneousValues: true },
    );
  }

  public async deleteComment(commentId: number, userId: number) {
    // Find the commentB
    const comment = await this.prismaService.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    if (comment.userId !== userId) {
      throw new ForbiddenException(
        'You are not allowed to delete this comment',
      );
    }
    await this.prismaService.comment.delete({ where: { id: commentId } });
    return { message: 'Comment deleted successfully' };
  }

  public async toggleLikeComment(commentId: number, userId: number) {
    // Check if the comment exists
    const comment = await this.prismaService.comment.findUnique({
      where: { id: commentId },
      include: {
        user: {
          select: {
            id: true,
            userName: true,
            firstName: true,
            lastName: true,
            picture: true,
          },
        },
        _count: {
          select: { likes: true },
        },
        likes: {
          where: { userId },
          select: { id: true },
        },
      },
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Check if user has already liked the comment
    const existingLike = await this.prismaService.commentLike.findUnique({
      where: {
        commentId_userId: {
          commentId,
          userId,
        },
      },
    });

    if (existingLike) {
      // Unlike the comment
      await this.prismaService.commentLike.delete({
        where: {
          commentId_userId: {
            commentId,
            userId,
          },
        },
      });
    } else {
      // Like the comment
      await this.prismaService.commentLike.create({
        data: {
          commentId,
          userId,
        },
      });
      // Send notification to comment owner (unless liker is the owner)
      if (comment.userId !== userId) {
        const fromUser = await this.prismaService.user.findUnique({
          where: { id: userId },
          select: { userName: true, firstName: true, lastName: true },
        });
        const displayName =
          fromUser.userName || `${fromUser.firstName} ${fromUser.lastName}`;
        await this.prismaService.notification.create({
          data: {
            userId: comment.userId,
            type: 'COMMENT_LIKE',
            content: `${displayName} liked your comment`,
            fromUserId: userId,
            postId: comment.postId,
            commentId: comment.id,
          },
        });
      }
    }

    // Fetch the updated comment
    const updatedComment = await this.prismaService.comment.findUnique({
      where: { id: commentId },
      include: {
        user: {
          select: {
            id: true,
            userName: true,
            firstName: true,
            lastName: true,
            picture: true,
          },
        },
        _count: {
          select: { likes: true },
        },
        likes: {
          where: { userId },
          select: { id: true },
        },
      },
    });

    return plainToInstance(
      CommentResponseDto,
      {
        ...updatedComment,
        likesCount: updatedComment._count.likes,
        isLiked: updatedComment.likes && updatedComment.likes.length > 0,
      },
      { excludeExtraneousValues: true },
    );
  }
}
