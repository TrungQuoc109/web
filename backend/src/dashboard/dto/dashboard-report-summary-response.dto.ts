import { ApiProperty } from '@nestjs/swagger';

export class DashboardReportSummaryResponseDto {
  @ApiProperty({
    description: 'Pending task reports waiting for review',
    example: 3,
  })
  pending!: number;

  @ApiProperty({
    description: 'Approved task reports',
    example: 14,
  })
  approved!: number;

  @ApiProperty({
    description: 'Rejected task reports',
    example: 2,
  })
  rejected!: number;

  @ApiProperty({
    description: 'Approval rate across reviewed reports',
    example: 88,
  })
  approvalRate!: number;

  @ApiProperty({
    description: 'Average review turnaround in hours, null when no reviews exist',
    example: 19,
    nullable: true,
  })
  averageReviewHours!: number | null;
}
