import { ApiProperty } from '@nestjs/swagger';
import { NotificationResponseDto } from './notification-response.dto';

export class NotificationCatalogResponseDto {
  @ApiProperty({
    type: NotificationResponseDto,
    isArray: true,
  })
  items!: NotificationResponseDto[];

  @ApiProperty({
    example: 42,
  })
  total!: number;

  @ApiProperty({
    example: 1,
  })
  page!: number;

  @ApiProperty({
    example: 20,
  })
  pageSize!: number;

  @ApiProperty({
    example: 3,
  })
  totalPages!: number;
}
