import { ApiProperty } from '@nestjs/swagger';
import { TaskAssignmentRole } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateTaskAssignmentDto {
  @IsEnum(TaskAssignmentRole)
  @ApiProperty({
    description: 'Vai trò mới của người được giao trong công việc',
    example: TaskAssignmentRole.LEAD,
  })
  role!: TaskAssignmentRole;
}
