import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '@prisma/client';
import { NotificationActivityResponseDto } from './notification-activity-response.dto';

export class NotificationResponseDto {
  @ApiProperty({
    description: 'ID thông báo',
    example: 322,
  })
  id!: number;

  @ApiProperty({
    description: 'ID người nhận thông báo',
    example: 9,
  })
  recipientId!: number;

  @ApiProperty({
    description: 'ID hoạt động tạo thông báo',
    example: 215,
  })
  activityId!: number;

  @ApiProperty({
    description: 'Đã đọc thông báo hay chưa',
    example: false,
  })
  isRead!: boolean;

  @ApiProperty({
    description: 'Thời điểm đánh dấu đã đọc (nếu đã đọc)',
    example: '2026-03-26T09:30:00.000Z',
    nullable: true,
  })
  readAt!: Date | null;

  @ApiProperty({
    description: 'Loại thông báo',
    example: NotificationType.ANNOUNCEMENT,
  })
  type!: NotificationType;

  @ApiProperty({
    description: 'Thời điểm tạo thông báo',
    example: '2026-03-25T11:05:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Chi tiết hoạt động liên quan đến thông báo',
    type: NotificationActivityResponseDto,
  })
  activity!: NotificationActivityResponseDto;
}
