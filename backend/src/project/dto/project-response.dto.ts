import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProjectResponseDto {
  @ApiProperty({
    description: 'ID của dự án',
    example: 21,
  })
  id!: number;

  @ApiProperty({
    description: 'Tên dự án',
    example: 'Ứng dụng quản lý công việc chung',
  })
  name!: string;

  @ApiPropertyOptional({
    description: 'Mô tả chi tiết của dự án',
    example: 'Dự án giúp đội phát triển phối hợp khi làm việc từ xa.',
  })
  description!: string | null;

  @ApiProperty({
    description: 'Thời điểm tạo dự án',
    example: '2026-02-10T09:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Thời điểm cập nhật gần nhất',
    example: '2026-03-05T16:45:00.000Z',
  })
  updatedAt!: Date;
}
