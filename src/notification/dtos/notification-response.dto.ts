import { Expose, Transform } from 'class-transformer';

export class NotificationResponseDto {
  @Expose()
  id: number;

  @Expose()
  type: string;

  @Expose()
  content: string;

  @Expose()
  isRead: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  @Transform(
    ({ obj }) =>
      obj.fromUser && {
        id: obj.fromUser.id,
        userName: obj.fromUser.userName,
        firstName: obj.fromUser.firstName,
        lastName: obj.fromUser.lastName,
        picture: obj.fromUser.picture,
      },
  )
  fromUser: any;

  @Expose()
  postId?: number;

  @Expose()
  commentId?: number;
}
