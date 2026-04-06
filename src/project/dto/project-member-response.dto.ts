import { ApiProperty } from '@nestjs/swagger';
import { ProjectRole, Role } from '@prisma/client';

export class ProjectMemberUserResponseDto {
  @ApiProperty({
    description: 'ID người dùng thuộc dự án',
    example: 64,
  })
  id!: number;

  @ApiProperty({
    description: 'Email đăng nhập của thành viên',
    example: 'huong.nguyen@example.com',
  })
  email!: string;

  @ApiProperty({
    description: 'Tên hiển thị (nếu có)',
    example: 'Nguyễn Hương',
    nullable: true,
  })
  name!: string | null;

  @ApiProperty({
    description: 'Vai trò người dùng chung trong hệ thống',
    example: Role.MEMBER,
  })
  role!: Role;
}

export class ProjectMemberResponseDto {
  @ApiProperty({
    description: 'ID liên kết thành viên trong dự án',
    example: 128,
  })
  id!: number;

  @ApiProperty({
    description: 'Vai trò thành viên trong dự án',
    example: ProjectRole.MEMBER,
  })
  role!: ProjectRole;

  @ApiProperty({
    description: 'Thời điểm thành viên được thêm vào',
    example: '2026-03-12T10:25:00.000Z',
  })
  joinedAt!: Date;

  @ApiProperty({
    description: 'Thông tin người dùng liên quan',
    type: ProjectMemberUserResponseDto,
  })
  user!: ProjectMemberUserResponseDto;
}
