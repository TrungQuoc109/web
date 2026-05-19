import { ApiProperty } from '@nestjs/swagger';

export class DashboardActivityResponseDto {
  @ApiProperty({
    description: 'Stable activity item identifier',
    example: 'project-12-message-88',
  })
  id!: string;

  @ApiProperty({
    description: 'Readable activity title',
    example: 'Mobile Banking App - Announcement by Marcus Rivera',
  })
  title!: string;

  @ApiProperty({
    description: 'Activity description body',
    example: 'Pilot-bank beta scope is frozen until Friday release review.',
  })
  description!: string;

  @ApiProperty({
    description: 'Timestamp when the activity happened',
    example: '2026-04-17T08:30:00.000Z',
  })
  timestamp!: Date;
}
