import { ApiProperty } from '@nestjs/swagger';

export class DashboardMomentumResponseDto {
  @ApiProperty({
    description: 'Tasks created during the last seven days',
    example: 11,
  })
  tasksCreatedLast7Days!: number;

  @ApiProperty({
    description: 'Tasks completed during the last seven days',
    example: 7,
  })
  tasksCompletedLast7Days!: number;

  @ApiProperty({
    description: 'Reports submitted during the last seven days',
    example: 5,
  })
  reportsSubmittedLast7Days!: number;

  @ApiProperty({
    description: 'Project-level chat messages sent during the last seven days',
    example: 18,
  })
  projectMessagesLast7Days!: number;
}
