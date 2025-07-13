import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GetPostsDto } from './dtos/get-posts.dto';
import { PostResponseDto } from './dtos/post-response.dto';
import { PaginatedPostsDto } from './dtos/paginated-posts.dto';
import { CreatePostDto } from './dtos/create-post.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class PostService {
  constructor(private readonly prismaService: PrismaService) {}

  async getPosts(
    query: GetPostsDto,
    currentUserId?: number,
  ): Promise<PaginatedPostsDto> {
    const { page = 1, limit = 10, cursor, userId } = query;
    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where: any = {};
    if (userId) {
      where.userId = parseInt(userId);
    }

    // Build cursor condition for cursor-based pagination
    const cursorCondition = cursor ? { id: { lt: parseInt(cursor) } } : {};

    // Get posts with user information and counts (no comments for performance)
    const posts = await this.prismaService.post.findMany({
      where: {
        ...where,
        ...cursorCondition,
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
          select: {
            likes: true,
            comments: true,
          },
        },
        likes: currentUserId
          ? {
              where: {
                userId: currentUserId,
              },
              select: {
                id: true,
              },
            }
          : false,
      },
      orderBy: {
        createdAt: 'desc', // Most recent posts first
      },
      take: limit + 1, // Take one extra to check if there are more posts
      skip: cursor ? 0 : skip, // Skip only for offset-based pagination
    });

    // Check if there are more posts
    const hasNextPage = posts.length > limit;
    const postsToReturn = hasNextPage ? posts.slice(0, limit) : posts;
    const nextCursor = hasNextPage ? posts[limit - 1].id.toString() : undefined;

    // Get total count for pagination metadata
    const totalCount = await this.prismaService.post.count({
      where,
    });

    // Transform posts to include engagement metrics (no comments for performance)
    const transformedPosts = postsToReturn.map((post) => ({
      ...post,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
      isLiked: post.likes && post.likes.length > 0,
      hasComments: post._count.comments > 0,
    }));

    // Transform to DTO
    const postsDto = plainToInstance(PostResponseDto, transformedPosts, {
      excludeExtraneousValues: true,
    });

    return {
      posts: postsDto,
      hasNextPage,
      nextCursor,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
    };
  }

  async getPostById(
    id: number,
    currentUserId?: number,
  ): Promise<PostResponseDto> {
    const post = await this.prismaService.post.findUnique({
      where: { id },
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
          select: {
            likes: true,
            comments: true,
          },
        },
        likes: currentUserId
          ? {
              where: {
                userId: currentUserId,
              },
              select: {
                id: true,
              },
            }
          : false,
        comments: {
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
              select: {
                likes: true,
              },
            },
            likes: currentUserId
              ? {
                  where: {
                    userId: currentUserId,
                  },
                  select: {
                    id: true,
                  },
                }
              : false,
          },
          orderBy: {
            createdAt: 'desc', // Most recent comments first
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const transformedPost = {
      ...post,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
      isLiked: post.likes && post.likes.length > 0,
      hasComments: post._count.comments > 0,
      comments: post.comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        user: comment.user,
        likesCount: comment._count.likes,
        isLiked: comment.likes && comment.likes.length > 0,
      })),
    };

    return plainToInstance(PostResponseDto, transformedPost, {
      excludeExtraneousValues: true,
    });
  }

  async createPost(
    createPostDto: CreatePostDto,
    userId: number,
  ): Promise<PostResponseDto> {
    const post = await this.prismaService.post.create({
      data: {
        content: createPostDto.content,
        image: createPostDto.image || '',
        userId: userId,
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
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    const transformedPost = {
      ...post,
      likesCount: 0,
      commentsCount: 0,
      isLiked: false,
      hasComments: false,
    };

    return plainToInstance(PostResponseDto, transformedPost, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Create a notification when a user likes a post
   * @param postId - Post ID that was liked
   * @param fromUserId - User ID who liked the post
   */
  private async createLikeNotification(postId: number, fromUserId: number) {
    try {
      // Get the post with its author information
      const post = await this.prismaService.post.findUnique({
        where: { id: postId },
        include: {
          user: {
            select: {
              id: true,
              userName: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!post) {
        console.error('Post not found for notification creation');
        return;
      }

      // Don't create notification if user is liking their own post
      if (post.userId === fromUserId) {
        return;
      }

      // Get the user who liked the post
      const fromUser = await this.prismaService.user.findUnique({
        where: { id: fromUserId },
        select: {
          userName: true,
          firstName: true,
          lastName: true,
        },
      });

      if (!fromUser) {
        console.error('User not found for notification creation');
        return;
      }

      // Create display name for the user who liked
      const displayName =
        fromUser.userName || `${fromUser.firstName} ${fromUser.lastName}`;

      // Create the notification
      await this.prismaService.notification.create({
        data: {
          userId: post.userId, // Notify the post author
          type: 'LIKE',
          content: `${displayName} liked your post`,
          fromUserId: fromUserId,
          postId: postId,
        },
      });
    } catch (error) {
      console.error('Error creating like notification:', error);
    }
  }

  /**
   * Toggle like status for a post
   * If the user has liked the post, it will unlike it
   * If the user hasn't liked the post, it will like it
   *
   * @param postId - Post ID to toggle like status
   * @param userId - User ID who is toggling the like
   * @returns Updated post with like status
   */
  async toggleLikePost(
    postId: number,
    userId: number,
  ): Promise<PostResponseDto> {
    // Check if post exists
    const post = await this.prismaService.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check if user has already liked the post
    const existingLike = await this.prismaService.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (existingLike) {
      // User has liked the post, so unlike it
      await this.prismaService.like.delete({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
      });
    } else {
      // User hasn't liked the post, so like it
      await this.prismaService.like.create({
        data: {
          postId,
          userId,
        },
      });

      // Create notification only when liking (not when unliking)
      await this.createLikeNotification(postId, userId);
    }

    // Return the updated post
    return this.getPostById(postId, userId);
  }

  /**
   * Delete a post by ID (only the owner can delete)
   * @param postId - Post ID
   * @param userId - User ID (must be the owner)
   */
  async deletePost(
    postId: number,
    userId: number,
  ): Promise<{ message: string }> {
    const post = await this.prismaService.post.findUnique({
      where: { id: postId },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    if (post.userId !== userId) {
      throw new ForbiddenException('You are not allowed to delete this post');
    }
    await this.prismaService.post.delete({ where: { id: postId } });
    return { message: 'Post deleted successfully' };
  }
}
