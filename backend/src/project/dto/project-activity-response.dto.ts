import { ApiProperty } from '@nestjs/swagger';

export class ProjectActivityResponseDto {
  @ApiProperty({
    example: 'activity-message-42',
  })
  id!: string;

  @ApiProperty({
    example: 'Project message by Noah Kim',
  })
  title!: string;

  @ApiProperty({
    example: 'Shared the latest deployment status in the project room.',
  })
  description!: string;

  @ApiProperty({
    example: '2026-04-17T08:30:00.000Z',
  })
  timestamp!: Date;
}
