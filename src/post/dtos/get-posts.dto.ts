import { IsOptional, IsPositive, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class GetPostsDto {
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  limit?: number = 10;

  @IsOptional()
  @IsString()
  cursor?: string; // For cursor-based pagination (more efficient for infinite scroll)

  @IsOptional()
  @IsString()
  userId?: string; // To filter posts by specific user
}
