import { ApiProperty } from '@nestjs/swagger';

export class NotificationActivityResponseDto {
  @ApiProperty({
    description: 'ID hoạt động (tin nhắn) tạo thông báo',
    example: 215,
  })
  id!: number;

  @ApiProperty({
    description: 'Nội dung hoạt động',
    example: 'Cập nhật trạng thái cho task API',
  })
  content!: string;

  @ApiProperty({
    description: 'ID dự án liên quan',
    example: 8,
  })
  projectId!: number;

  @ApiProperty({
    description: 'ID công việc nếu có',
    example: 103,
    nullable: true,
  })
  taskId!: number | null;

  @ApiProperty({
    description: 'Đánh dấu hoạt động hệ thống',
    example: false,
  })
  isSystem!: boolean;

  @ApiProperty({
    description: 'Đánh dấu hoạt động là thông báo',
    example: true,
  })
  isAnnouncement!: boolean;

  @ApiProperty({
    description: 'Dữ liệu metadata tùy chọn',
    example: { version: '1.2', taskId: 103 },
    nullable: true,
  })
  metadata!: Record<string, unknown> | null;

  @ApiProperty({
    description: 'Thời điểm hoạt động xảy ra',
    example: '2026-03-25T11:00:00.000Z',
  })
  createdAt!: Date;
}
