import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsObject, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  @ApiProperty({
    description: 'Nội dung tin nhắn',
    example: 'Đã hoàn tất việc đồng bộ status công việc.',
  })
  content!: string;

  @IsOptional()
  @IsObject()
  @ApiPropertyOptional({
    description: 'Dữ liệu bổ sung (metadata) cho tin nhắn',
    example: { type: 'STATUS_UPDATE', taskId: 12 },
  })
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({
    description: 'Đánh dấu tin nhắn là thông báo nổi bật',
    example: false,
  })
  isAnnouncement?: boolean;
}
