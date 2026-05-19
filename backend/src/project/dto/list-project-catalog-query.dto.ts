import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

const projectStatuses = ['ACTIVE', 'PLANNING', 'AT_RISK', 'COMPLETED'] as const;

export class ListProjectCatalogQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @ApiPropertyOptional({
    description: 'Từ khóa tìm kiếm theo tên hoặc mô tả dự án',
    example: 'portal',
  })
  search?: string;

  @IsOptional()
  @IsIn(projectStatuses)
  @ApiPropertyOptional({
    description: 'Lọc theo trạng thái dự án đã được tổng hợp',
    enum: projectStatuses,
    example: 'ACTIVE',
  })
  status?: (typeof projectStatuses)[number];

  @Transform(({ value }) => Number(value ?? 1))
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({
    description: 'Trang hiện tại',
    example: 1,
    default: 1,
  })
  page = 1;

  @Transform(({ value }) => Number(value ?? 9))
  @IsInt()
  @Min(1)
  @Max(24)
  @ApiPropertyOptional({
    description: 'Số lượng dự án mỗi trang',
    example: 9,
    default: 9,
  })
  pageSize = 9;
}
