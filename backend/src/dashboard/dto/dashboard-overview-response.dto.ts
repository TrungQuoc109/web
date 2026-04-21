import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus } from '@prisma/client';
import { DashboardActivityResponseDto } from './dashboard-activity-response.dto';
import { DashboardAnalyticsResponseDto } from './dashboard-analytics-response.dto';

export class DashboardOverviewResponseDto {
  @ApiProperty({
    description: 'Total number of projects visible to the current user',
    example: 5,
  })
  totalProjects!: number;

  @ApiProperty({
    description: 'Total number of tasks visible to the current user',
    example: 40,
  })
  totalTasks!: number;

  @ApiProperty({
    description: 'Task counts grouped by workflow status',
    example: {
      TODO: 8,
      IN_PROGRESS: 12,
      IN_REVIEW: 6,
      DONE: 10,
      BLOCKED: 4,
    },
  })
  tasksByStatus!: Record<TaskStatus, number>;

  @ApiProperty({
    description: 'Expanded workspace analytics for delivery, review health, and project risk',
    type: DashboardAnalyticsResponseDto,
  })
  analytics!: DashboardAnalyticsResponseDto;

  @ApiProperty({
    description: 'Most recent project-level activities visible to the current user',
    type: DashboardActivityResponseDto,
    isArray: true,
  })
  recentActivity!: DashboardActivityResponseDto[];
}
