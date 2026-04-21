import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ListMessagesQueryDto {
  @ApiPropertyOptional({
    description: 'Trang hiện tại',
    example: 1,
    default: 1,
  })
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({
    description: 'Số tin nhắn trên mỗi trang',
    example: 30,
    default: 30,
  })
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 30;

  @ApiPropertyOptional({
    description: 'Từ khóa tìm kiếm trong nội dung tin nhắn',
    example: 'deploy',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
