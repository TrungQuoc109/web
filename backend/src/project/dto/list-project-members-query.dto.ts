import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectRole } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class ListProjectMembersQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @ApiPropertyOptional({
    description: 'Từ khóa tìm kiếm theo tên hoặc email thành viên',
    example: 'nguyen',
  })
  search?: string;

  @IsOptional()
  @IsEnum(ProjectRole)
  @ApiPropertyOptional({
    description: 'Lọc theo vai trò thành viên trong dự án',
    enum: ProjectRole,
    example: ProjectRole.MEMBER,
  })
  role?: ProjectRole;
}
