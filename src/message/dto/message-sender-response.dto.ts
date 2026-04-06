import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class MessageSenderResponseDto {
  @ApiProperty({
    description: 'ID người gửi tin nhắn',
    example: 12,
  })
  id!: number;

  @ApiProperty({
    description: 'Email người gửi',
    example: 'linh.tran@example.com',
  })
  email!: string;

  @ApiProperty({
    description: 'Tên hiển thị người gửi (nếu có)',
    example: 'Trần Linh',
    nullable: true,
  })
  name!: string | null;

  @ApiProperty({
    description: 'Vai trò hệ thống của người gửi',
    example: Role.MEMBER,
  })
  role!: Role;
}
