import { IsArray, IsInt, IsOptional, IsPositive } from 'class-validator';

export class MarkNotificationReadDto {
  @IsOptional()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  @IsArray()
  notificationIds?: number[];
}
