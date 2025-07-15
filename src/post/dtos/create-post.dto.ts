import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  ValidateIf,
} from 'class-validator';

export class CreatePostDto {
  @ValidateIf((o) => !o.image || o.image.trim() === '')
  @IsString()
  @IsNotEmpty({ message: 'Post content is required when no image is provided' })
  @MaxLength(280, { message: 'Post content cannot exceed 280 characters' })
  content: string;

  @IsOptional()
  @IsString()
  image?: string; // This will store the Cloudinary URL after upload
}
