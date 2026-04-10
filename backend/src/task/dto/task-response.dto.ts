import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatus, TaskPriority } from '@prisma/client';
import { TaskAssignmentResponseDto } from './task-assignment-response.dto';

export class TaskResponseDto {
  @ApiProperty({
    description: 'ID của công việc',
    example: 103,
  })
  id!: number;

  @ApiProperty({
    description: 'Tiêu đề công việc',
    example: 'Cập nhật API thông báo',
  })
  title!: string;

  @ApiPropertyOptional({
    description: 'Mô tả chi tiết công việc',
    example: 'Thêm endpoint phân trang cho tiện ích thông báo mới.',
  })
  description!: string | null;

  @ApiProperty({
    description: 'Trạng thái hiện tại của công việc',
    example: TaskStatus.IN_PROGRESS,
  })
  status!: TaskStatus;

  @ApiProperty({
    description: 'Độ ưu tiên công việc',
    example: TaskPriority.HIGH,
  })
  priority!: TaskPriority;

  @ApiProperty({
    description: 'ID dự án chứa công việc',
    example: 12,
  })
  projectId!: number;

  @ApiProperty({
    description: 'Thời điểm tạo công việc',
    example: '2026-03-05T08:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Thời điểm cập nhật cuối cùng của công việc',
    example: '2026-03-20T11:44:00.000Z',
  })
  updatedAt!: Date;

  @ApiProperty({
    description: 'Danh sách phân công cho công việc này',
    type: TaskAssignmentResponseDto,
    isArray: true,
  })
  assignments!: TaskAssignmentResponseDto[];
}
