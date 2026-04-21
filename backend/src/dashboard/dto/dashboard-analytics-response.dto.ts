import { ApiProperty } from '@nestjs/swagger';
import { TaskPriority } from '@prisma/client';
import type { ProjectStatusView } from '../../project/project.types';
import { DashboardMomentumResponseDto } from './dashboard-momentum-response.dto';
import { DashboardReportSummaryResponseDto } from './dashboard-report-summary-response.dto';
import { DashboardTrendPointResponseDto } from './dashboard-trend-point-response.dto';

export class DashboardAnalyticsResponseDto {
  @ApiProperty({
    description: 'Project health counts grouped by derived status',
    example: {
      ACTIVE: 2,
      PLANNING: 1,
      AT_RISK: 1,
      COMPLETED: 1,
    },
  })
  projectHealth!: Record<ProjectStatusView, number>;

  @ApiProperty({
    description: 'Task counts grouped by priority',
    example: {
      LOW: 4,
      MEDIUM: 12,
      HIGH: 8,
      URGENT: 2,
    },
  })
  tasksByPriority!: Record<TaskPriority, number>;

  @ApiProperty({
    description: 'Seven-day delivery trend',
    type: DashboardTrendPointResponseDto,
    isArray: true,
  })
  deliveryTrend!: DashboardTrendPointResponseDto[];

  @ApiProperty({
    description: 'Momentum metrics for the last seven days',
    type: DashboardMomentumResponseDto,
  })
  momentum!: DashboardMomentumResponseDto;

  @ApiProperty({
    description: 'Task report review summary',
    type: DashboardReportSummaryResponseDto,
  })
  reviewSummary!: DashboardReportSummaryResponseDto;
}
