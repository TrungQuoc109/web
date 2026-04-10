import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class TaskUserResponseDto {
  @ApiProperty({
    description: 'ID người dùng liên quan đến công việc',
    example: 19,
  })
  id!: number;

  @ApiProperty({
    description: 'Email của người dùng',
    example: 'minh.tran@example.com',
  })
  email!: string;

  @ApiProperty({
    description: 'Tên hiển thị (nếu có)',
    example: 'Trần Minh',
    nullable: true,
  })
  name!: string | null;

  @ApiProperty({
    description: 'Vai trò hệ thống của người dùng',
    example: Role.MEMBER,
  })
  role!: Role;
}
