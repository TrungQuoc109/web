import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum } from 'class-validator';
import { ProjectRole } from '@prisma/client';

export class AddMemberDto {
  @IsEmail()
  @ApiProperty({
    description: 'Email của thành viên sẽ được thêm vào dự án',
    example: 'tuan.pham@example.com',
  })
  email!: string;

  @IsEnum(ProjectRole)
  @ApiProperty({
    description: 'Vai trò của thành viên trong dự án',
    example: ProjectRole.MEMBER,
  })
  role!: ProjectRole;
}
