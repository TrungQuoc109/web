import { ApiProperty } from '@nestjs/swagger';
import { MessageSenderResponseDto } from './message-sender-response.dto';

export class MessageResponseDto {
  @ApiProperty({
    description: 'ID tin nhắn',
    example: 215,
  })
  id!: number;

  @ApiProperty({
    description: 'Nội dung tin nhắn',
    example: 'Dự án đã cập nhật tiến độ đợt mới.',
  })
  content!: string;

  @ApiProperty({
    description: 'ID người gửi (nếu có)',
    example: 12,
    nullable: true,
  })
  senderId!: number | null;

  @ApiProperty({
    description: 'ID dự án liên quan đến tin nhắn',
    example: 8,
  })
  projectId!: number;

  @ApiProperty({
    description: 'ID công việc liên kết (nếu có)',
    example: 103,
    nullable: true,
  })
  taskId!: number | null;

  @ApiProperty({
    description: 'Đánh dấu tin nhắn hệ thống',
    example: false,
  })
  isSystem!: boolean;

  @ApiProperty({
    description: 'Đánh dấu tin nhắn quan trọng',
    example: false,
  })
  isImportant!: boolean;

  @ApiProperty({
    description: 'Đánh dấu tin nhắn là thông báo',
    example: false,
  })
  isAnnouncement!: boolean;

  @ApiProperty({
    description: 'Dữ liệu metadata bổ sung (nếu có)',
    example: { version: '1.0', taskId: 103 },
    nullable: true,
  })
  metadata!: Record<string, unknown> | null;

  @ApiProperty({
    description: 'Thời điểm tạo tin nhắn',
    example: '2026-03-18T14:15:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Thông tin người gửi',
    type: MessageSenderResponseDto,
    nullable: true,
  })
  sender!: MessageSenderResponseDto | null;
}
