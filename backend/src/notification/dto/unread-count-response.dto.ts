import { ApiProperty } from '@nestjs/swagger';

export class UnreadCountResponseDto {
  @ApiProperty({
    description: 'Số lượng thông báo chưa đọc',
    example: 4,
  })
  unreadCount!: number;
}
