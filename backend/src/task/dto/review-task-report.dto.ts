import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportStatus } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class ReviewTaskReportDto {
  @IsEnum(ReportStatus)
  @ApiProperty({
    description: 'Trạng thái đánh giá báo cáo',
    example: ReportStatus.APPROVED,
  })
  status!: ReportStatus;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  @ApiPropertyOptional({
    description: 'Phản hồi cho người gửi sau khi xem xét',
    example: 'Đã duyệt và cập nhật vào mục tiến độ tuần này.',
  })
  feedback?: string;

  @ValidateIf((value: ReviewTaskReportDto) => value.status === ReportStatus.REJECTED)
  @IsString()
  @MaxLength(5000)
  @ApiPropertyOptional({
    description: 'Lý do từ chối báo cáo khi trạng thái là REJECTED',
    example: 'Báo cáo thiếu tài liệu minh họa kết quả nghiệm thu.',
  })
  rejectionReason?: string;
}
