import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskPriority } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  @ApiProperty({
    description: 'Tiêu đề của công việc',
    example: 'Thiết kế lại giao diện báo cáo',
  })
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  @ApiPropertyOptional({
    description: 'Mô tả chi tiết công việc',
    example: 'Tập trung vào nâng cao trải nghiệm xem báo cáo KPI theo dự án.',
  })
  description?: string;

  @IsOptional()
  @IsEnum(TaskPriority)
  @ApiPropertyOptional({
    description: 'Độ ưu tiên xử lý công việc',
    example: TaskPriority.MEDIUM,
  })
  priority?: TaskPriority;
}
