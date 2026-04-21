import { ApiProperty } from '@nestjs/swagger';
import { MessageResponseDto } from './message-response.dto';

export class MessageCatalogResponseDto {
  @ApiProperty({
    type: MessageResponseDto,
    isArray: true,
  })
  items!: MessageResponseDto[];

  @ApiProperty({
    example: 85,
  })
  total!: number;

  @ApiProperty({
    example: 1,
  })
  page!: number;

  @ApiProperty({
    example: 30,
  })
  pageSize!: number;

  @ApiProperty({
    example: 3,
  })
  totalPages!: number;
}
