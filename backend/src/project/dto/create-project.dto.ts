import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  @ApiProperty({
    description: 'Tên của dự án',
    example: 'Nền tảng báo cáo thời gian thực',
  })
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @ApiPropertyOptional({
    description: 'Mô tả chi tiết về dự án',
    example: 'Dự án quản lý công việc dùng trong nội bộ đội ngũ phát triển phần mềm.',
  })
  description?: string;
}
