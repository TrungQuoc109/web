import { TaskStatus } from '@prisma/client';
import { IsEnum, IsInt, Min } from 'class-validator';

export class SocketTaskUpdateDto {
  @IsInt()
  @Min(1)
  taskId!: number;

  @IsEnum(TaskStatus)
  status!: TaskStatus;
}
