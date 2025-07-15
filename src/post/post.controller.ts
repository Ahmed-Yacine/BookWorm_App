import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  ParseIntPipe,
  Request,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PostService } from './post.service';
import { GetPostsDto } from './dtos/get-posts.dto';
import { PaginatedPostsDto } from './dtos/paginated-posts.dto';
import { PostResponseDto } from './dtos/post-response.dto';
import { CreatePostDto } from './dtos/create-post.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { AuthGuard } from '../user/guards/auth.guard';

@Controller('posts')
export class PostController {
  constructor(
    private readonly postService: PostService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Get paginated posts with infinite scroll support
   * Supports both cursor-based and offset-based pagination
   * @param query - Pagination parameters (page, limit, cursor, userId)
   * @param req - Request object (optional authentication)
   * @returns Paginated posts with metadata
   */
  @Get('all')
  public async getPosts(
    @Query() query: GetPostsDto,
    @Request() req: any,
  ): Promise<PaginatedPostsDto> {
    // Extract user ID from request if authenticated (optional)
    const currentUserId = req.user?.id;
    return this.postService.getPosts(query, currentUserId);
  }

  /**
   * Get a single post by ID
   * @param id - Post ID
   * @param req - Request object (optional authentication)
   * @returns Post details with user information and engagement metrics
   */
  @Get(':id')
  public async getPostById(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<PostResponseDto> {
    // Extract user ID from request if authenticated (optional)
    const currentUserId = req.user?.id;
    return this.postService.getPostById(id, currentUserId);
  }

  /**
   * Create a new post with optional image upload
   *
   * This endpoint allows authenticated users to create posts with text content and/or images.
   * The image will be uploaded to Cloudinary and the URL will be stored in the database.
   *
   * Authentication: Required (JWT Bearer token)
   * Content-Type: multipart/form-data
   *
   * @param createPostDto - Post data (content and optional image URL)
   * @param file - Uploaded image file (optional, field name: 'image')
   * @param req - Request object (contains authenticated user info)
   * @returns Created post with user information and engagement metrics
   *
   * Example usage:
   * POST /post
   * Headers: Authorization: Bearer <jwt_token>
   * Body: multipart/form-data
   *   - content: "Hello world!"
   *   - image: [file upload] (optional)
   *
   * Response:
   * {
   *   "id": 1,
   *   "content": "Hello world!",
   *   "image": "https://res.cloudinary.com/...",
   *   "createdAt": "2024-01-01T00:00:00.000Z",
   *   "updatedAt": "2024-01-01T00:00:00.000Z",
   *   "user": {
   *     "id": 1,
   *     "userName": "john_doe",
   *     "firstName": "John",
   *     "lastName": "Doe",
   *     "picture": "https://..."
   *   },
   *   "likesCount": 0,
   *   "commentsCount": 0,
   *   "isLiked": false,
   *   "hasComments": false
   * }
   *
   * Future Enhancement:
   * - Support for multiple photo uploads (array of images)
   * - Batch upload to Cloudinary for multiple images
   * - Gallery view for posts with multiple images
   *
   */
  @Post('create')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  public async createPost(
    @Body() createPostDto: CreatePostDto,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ): Promise<PostResponseDto> {
    // Check if user is authenticated
    if (!req.user?.id) {
      throw new BadRequestException(
        'User must be authenticated to create a post',
      );
    }

    let imageUrl = createPostDto.image;

    // If a file is provided, upload it to Cloudinary
    if (file) {
      try {
        const cloudinaryResponse =
          await this.cloudinaryService.uploadFile(file);
        imageUrl = cloudinaryResponse.secure_url;
      } catch {
        throw new BadRequestException('Failed to upload image to Cloudinary');
      }
    }

    // Create the post with the image URL (either from Cloudinary or provided in DTO)
    return this.postService.createPost(
      {
        content: createPostDto.content,
        image: imageUrl,
      },
      req.user.id,
    );
  }

  /**
   * Toggle like status for a post
   *
   * This endpoint allows authenticated users to toggle the like status of a post.
   * If the user has liked the post, it will unlike it.
   * If the user hasn't liked the post, it will like it.
   *
   * Authentication: Required (JWT Bearer token)
   *
   * @param id - Post ID to toggle like status
   * @param req - Request object (contains authenticated user info)
   * @returns Updated post with like status
   *
   * Example usage:
   * POST /post/1/toggle-like
   * Headers: Authorization: Bearer <jwt_token>
   *
   * Response (when liking):
   * {
   *   "id": 1,
   *   "content": "Hello world!",
   *   "image": "https://res.cloudinary.com/...",
   *   "createdAt": "2024-01-01T00:00:00.000Z",
   *   "updatedAt": "2024-01-01T00:00:00.000Z",
   *   "user": {
   *     "id": 1,
   *     "userName": "john_doe",
   *     "firstName": "John",
   *     "lastName": "Doe",
   *     "picture": "https://..."
   *   },
   *   "likesCount": 1,
   *   "commentsCount": 0,
   *   "isLiked": true,
   *   "hasComments": false
   * }
   *
   * Response (when unliking):
   * {
   *   "id": 1,
   *   "content": "Hello world!",
   *   "image": "https://res.cloudinary.com/...",
   *   "createdAt": "2024-01-01T00:00:00.000Z",
   *   "updatedAt": "2024-01-01T00:00:00.000Z",
   *   "user": {
   *     "id": 1,
   *     "userName": "john_doe",
   *     "firstName": "John",
   *     "lastName": "Doe",
   *     "picture": "https://..."
   *   },
   *   "likesCount": 0,
   *   "commentsCount": 0,
   *   "isLiked": false,
   *   "hasComments": false
   * }
   */
  @Post(':id/toggle-like')
  @UseGuards(AuthGuard)
  public async toggleLikePost(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<PostResponseDto> {
    // Check if user is authenticated
    if (!req.user?.id) {
      throw new BadRequestException(
        'User must be authenticated to toggle like status',
      );
    }

    return this.postService.toggleLikePost(id, req.user.id);
  }

  /**
   * Delete a post by ID (only the owner can delete)
   *
   * Authentication: Required (JWT Bearer token)
   *
   * @param id - Post ID
   * @param req - Request object (contains authenticated user info)
   * @returns Success message
   *
   * Example usage:
   * DELETE /post/1
   * Headers: Authorization: Bearer <jwt_token>
   *
   * Response:
   * {
   *   "message": "Post deleted successfully"
   * }
   */
  @Delete('delete/:id')
  @UseGuards(AuthGuard)
  public async deletePost(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<{ message: string }> {
    if (!req.user?.id) {
      throw new BadRequestException(
        'User must be authenticated to delete a post',
      );
    }
    return this.postService.deletePost(id, req.user.id);
  }
}
