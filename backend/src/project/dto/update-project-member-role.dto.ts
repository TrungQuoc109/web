import { ApiProperty } from '@nestjs/swagger';
import { ProjectRole } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateProjectMemberRoleDto {
  @IsEnum(ProjectRole)
  @ApiProperty({
    description: 'Vai trò mới của thành viên trong dự án',
    example: ProjectRole.MEMBER,
  })
  role!: ProjectRole;
}
