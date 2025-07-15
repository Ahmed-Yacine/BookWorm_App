import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { AuthGuard } from '../user/guards/auth.guard';
import { MarkNotificationReadDto } from './dtos/mark-notification-read.dto';
import { NotificationResponseDto } from './dtos/notification-response.dto';
import { plainToInstance } from 'class-transformer';

@Controller('notification')
@UseGuards(AuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @UseGuards(AuthGuard)
  async getNotifications(
    @Request() req: any,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    const { notifications, totalCount, totalPages } =
      await this.notificationService.getUserNotifications(
        req.user.id,
        Number(page),
        Number(limit),
      );
    return {
      notifications: plainToInstance(NotificationResponseDto, notifications, {
        excludeExtraneousValues: true,
      }),
      totalCount,
      totalPages,
    };
  }

  @Post('mark-read')
  async markAsRead(@Request() req: any, @Body() dto: MarkNotificationReadDto) {
    return this.notificationService.markAsRead(
      req.user.id,
      dto.notificationIds,
    );
  }

  @Delete()
  async deleteNotifications(
    @Request() req: any,
    @Body() dto: MarkNotificationReadDto,
  ) {
    return this.notificationService.deleteNotifications(
      req.user.id,
      dto.notificationIds,
    );
  }
}
