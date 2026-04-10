import { ApiProperty } from '@nestjs/swagger';
import { TaskAssignmentRole } from '@prisma/client';
import { TaskUserResponseDto } from './task-user-response.dto';

export class TaskAssignmentResponseDto {
  @ApiProperty({
    description: 'ID bản ghi phân công công việc',
    example: 88,
  })
  id!: number;

  @ApiProperty({
    description: 'Vai trò của người được giao',
    example: TaskAssignmentRole.CONTRIBUTOR,
  })
  role!: TaskAssignmentRole;

  @ApiProperty({
    description: 'ID người giao nhiệm vụ (nếu có)',
    example: 2,
    nullable: true,
  })
  assignedById!: number | null;

  @ApiProperty({
    description: 'Thời điểm phân công',
    example: '2026-03-20T14:30:00.000Z',
  })
  assignedAt!: Date;

  @ApiProperty({
    description: 'Thông tin người dùng được giao',
    type: TaskUserResponseDto,
  })
  user!: TaskUserResponseDto;
}
