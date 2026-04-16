import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  @ApiPropertyOptional({
    description: 'Tên dự án sau khi cập nhật',
    example: 'Customer Success Portal',
  })
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @ApiPropertyOptional({
    description: 'Mô tả dự án sau khi cập nhật',
    example: 'Internal portal used by the support and success teams.',
    nullable: true,
  })
  description?: string;
}
