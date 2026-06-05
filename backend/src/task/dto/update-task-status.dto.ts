import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus } from '@prisma/client';
import { IsEnum, IsInt, IsOptional } from 'class-validator';

export class UpdateTaskStatusDto {
  @IsEnum(TaskStatus)
  @ApiProperty({
    description: 'Trạng thái muốn cập nhật cho công việc',
    example: TaskStatus.IN_PROGRESS,
  })
  status!: TaskStatus;

  @IsOptional()
  @IsInt()
  @ApiProperty({
    description: 'Phiên bản hiện tại của công việc (để khóa lạc quan)',
    example: 0,
    required: false,
  })
  version?: number;
}
