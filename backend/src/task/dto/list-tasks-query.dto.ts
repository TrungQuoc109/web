import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { TaskPriority, TaskStatus } from '@prisma/client';

export class ListTasksQueryDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Search term matched against task title, description, or assignee',
    example: 'payroll',
  })
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @ApiPropertyOptional({
    description: 'Filter tasks by project id',
    example: 12,
  })
  projectId?: number;

  @IsOptional()
  @IsEnum(TaskStatus)
  @ApiPropertyOptional({
    description: 'Filter tasks by workflow status',
    enum: TaskStatus,
    example: TaskStatus.IN_PROGRESS,
  })
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  @ApiPropertyOptional({
    description: 'Filter tasks by planning priority',
    enum: TaskPriority,
    example: TaskPriority.HIGH,
  })
  priority?: TaskPriority;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @ApiPropertyOptional({
    description: 'Filter tasks assigned to a specific user',
    example: 7,
  })
  assigneeId?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({
    description: '1-based result page',
    example: 1,
    default: 1,
  })
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @ApiPropertyOptional({
    description: 'Number of task records returned per page',
    example: 20,
    default: 20,
  })
  pageSize = 20;
}
