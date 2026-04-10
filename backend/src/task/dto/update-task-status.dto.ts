import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateTaskStatusDto {
  @IsEnum(TaskStatus)
  @ApiProperty({
    description: 'Trạng thái muốn cập nhật cho công việc',
    example: TaskStatus.IN_PROGRESS,
  })
  status!: TaskStatus;
}
