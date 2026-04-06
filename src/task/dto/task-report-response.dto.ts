import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportStatus } from '@prisma/client';
import { TaskUserResponseDto } from './task-user-response.dto';

export class TaskReportResponseDto {
  @ApiProperty({
    description: 'ID báo cáo công việc',
    example: 57,
  })
  id!: number;

  @ApiProperty({
    description: 'Nội dung báo cáo',
    example: 'Hoàn thành phần backend cho xử lý đánh giá báo cáo tuần 13.',
  })
  content!: string;

  @ApiProperty({
    description: 'Danh sách đường dẫn tệp đính kèm',
    example: ['https://storage.example.com/report-57.pdf'],
    isArray: true,
  })
  attachments!: string[];

  @ApiProperty({
    description: 'Trạng thái báo cáo sau duyệt',
    example: ReportStatus.PENDING,
  })
  status!: ReportStatus;

  @ApiPropertyOptional({
    description: 'Phản hồi của người duyệt báo cáo',
    example: 'Cần bổ sung thông tin về các trường hợp lỗi đã kiểm thử.',
    nullable: true,
  })
  feedback!: string | null;

  @ApiProperty({
    description: 'ID công việc liên quan',
    example: 103,
  })
  taskId!: number;

  @ApiProperty({
    description: 'ID tác giả của báo cáo',
    example: 8,
  })
  authorId!: number;

  @ApiProperty({
    description: 'Thời điểm tạo báo cáo',
    example: '2026-03-21T07:20:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Thời điểm cập nhật báo cáo gần nhất',
    example: '2026-03-21T09:00:00.000Z',
  })
  updatedAt!: Date;

  @ApiProperty({
    description: 'Thông tin tác giả báo cáo',
    type: TaskUserResponseDto,
  })
  author!: TaskUserResponseDto;
}
