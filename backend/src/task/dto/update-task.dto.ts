import { ApiPropertyOptional } from '@nestjs/swagger';
import { TaskPriority } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  @ApiPropertyOptional({
    description: 'Tiêu đề mới của công việc',
    example: 'Ship v2 onboarding checklist',
  })
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @ApiPropertyOptional({
    description: 'Mô tả mới của công việc',
    example: 'Align the final onboarding checklist with launch scope.',
    nullable: true,
  })
  description?: string;

  @IsOptional()
  @IsEnum(TaskPriority)
  @ApiPropertyOptional({
    description: 'Mức độ ưu tiên mới của công việc',
    example: TaskPriority.HIGH,
  })
  priority?: TaskPriority;
}
