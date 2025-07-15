import { Expose, Transform, Type } from 'class-transformer';

export class CommentResponseDto {
  @Expose()
  id: number;

  @Expose()
  content: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  @Transform(({ obj }) => ({
    id: obj.user.id,
    userName: obj.user.userName,
    firstName: obj.user.firstName,
    lastName: obj.user.lastName,
    picture: obj.user.picture,
  }))
  user: {
    id: number;
    userName: string;
    firstName: string;
    lastName: string;
    picture: string;
  };

  @Expose()
  @Transform(({ obj }) => obj.likesCount || 0)
  likesCount: number;

  @Expose()
  @Transform(({ obj }) => obj.isLiked || false)
  isLiked: boolean;
}

export class PostResponseDto {
  @Expose()
  id: number;

  @Expose()
  content: string;

  @Expose()
  image: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  @Transform(({ obj }) => ({
    id: obj.user.id,
    userName: obj.user.userName,
    firstName: obj.user.firstName,
    lastName: obj.user.lastName,
    picture: obj.user.picture,
  }))
  user: {
    id: number;
    userName: string;
    firstName: string;
    lastName: string;
    picture: string;
  };

  @Expose()
  @Transform(({ obj }) => obj._count?.likes || 0)
  likesCount: number;

  @Expose()
  @Transform(({ obj }) => obj._count?.comments || 0)
  commentsCount: number;

  @Expose()
  @Transform(({ obj }) => obj._count?.likes > 0)
  isLiked: boolean;

  @Expose()
  @Transform(({ obj }) => obj._count?.comments > 0)
  hasComments: boolean;

  @Expose()
  @Type(() => CommentResponseDto)
  comments?: CommentResponseDto[]; // Optional - only included in getPostById
}
