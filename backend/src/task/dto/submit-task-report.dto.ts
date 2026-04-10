import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitTaskReportDto {
  @IsString()
  @MinLength(10)
  @MaxLength(10000)
  @ApiProperty({
    description: 'Nội dung chi tiết báo cáo công việc',
    example: 'Hoàn thành phần dịch vụ thời gian thực và cập nhật tài liệu API.',
  })
  content!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(2048, { each: true })
  @ApiPropertyOptional({
    description: 'Các đường dẫn file đính kèm (nếu có)',
    example: ['https://storage.example.com/report-1.pdf'],
  })
  attachments?: string[];
}
