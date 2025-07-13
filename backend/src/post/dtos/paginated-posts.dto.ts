import { Expose, Type } from 'class-transformer';
import { PostResponseDto } from './post-response.dto';

export class PaginatedPostsDto {
  @Expose()
  @Type(() => PostResponseDto)
  posts: PostResponseDto[];

  @Expose()
  hasNextPage: boolean;

  @Expose()
  nextCursor?: string;

  @Expose()
  totalCount: number;

  @Expose()
  currentPage: number;

  @Expose()
  totalPages: number;
}
