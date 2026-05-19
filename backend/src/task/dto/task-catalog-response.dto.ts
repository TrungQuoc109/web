import { ApiProperty } from '@nestjs/swagger';
import { TaskResponseDto } from './task-response.dto';

export class TaskCatalogResponseDto {
  @ApiProperty({
    description: 'Paginated task records',
    type: TaskResponseDto,
    isArray: true,
  })
  items!: TaskResponseDto[];

  @ApiProperty({
    description: 'Total matching task count',
    example: 40,
  })
  total!: number;

  @ApiProperty({
    description: 'Current result page',
    example: 1,
  })
  page!: number;

  @ApiProperty({
    description: 'Number of results per page',
    example: 20,
  })
  pageSize!: number;

  @ApiProperty({
    description: 'Total available pages',
    example: 2,
  })
  totalPages!: number;
}
