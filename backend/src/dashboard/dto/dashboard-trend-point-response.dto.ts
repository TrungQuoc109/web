import { ApiProperty } from '@nestjs/swagger';

export class DashboardTrendPointResponseDto {
  @ApiProperty({
    description: 'Short day label for the trend point',
    example: 'Mon',
  })
  label!: string;

  @ApiProperty({
    description: 'Tasks created on this day',
    example: 3,
  })
  created!: number;

  @ApiProperty({
    description: 'Tasks completed on this day',
    example: 2,
  })
  completed!: number;

  @ApiProperty({
    description: 'Task reports reviewed on this day',
    example: 1,
  })
  reviewed!: number;
}
