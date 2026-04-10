import { ApiProperty } from '@nestjs/swagger';
import { TaskAssignmentRole } from '@prisma/client';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TaskAssigneeDto {
  @IsInt()
  @Min(1)
  @ApiProperty({
    description: 'ID người dùng được giao công việc',
    example: 5,
  })
  userId!: number;

  @IsEnum(TaskAssignmentRole)
  @ApiProperty({
    description: 'Vai trò của người dùng trong công việc',
    example: TaskAssignmentRole.CONTRIBUTOR,
  })
  role!: TaskAssignmentRole;
}

export class AssignTaskUsersDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TaskAssigneeDto)
  @ApiProperty({
    description: 'Danh sách người được giao tham gia công việc',
    type: TaskAssigneeDto,
    isArray: true,
  })
  assignees!: TaskAssigneeDto[];
}
