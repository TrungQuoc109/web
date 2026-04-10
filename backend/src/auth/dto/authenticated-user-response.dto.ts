import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../auth.types';

export class AuthenticatedUserResponseDto {
  @ApiProperty({
    description: 'ID định danh của người dùng',
    example: 42,
  })
  id!: number;

  @ApiProperty({
    description: 'Email đăng nhập của người dùng',
    example: 'hang.le@example.com',
  })
  email!: string;

  @ApiProperty({
    description: 'Tên hiển thị (nếu có)',
    example: 'Lê Thị Hằng',
    nullable: true,
  })
  name!: string | null;

  @ApiProperty({
    description: 'Vai trò hiện tại trong hệ thống',
    example: 'MEMBER',
  })
  role!: UserRole;

  @ApiProperty({
    description: 'Thời điểm tạo tài khoản',
    example: '2026-03-01T08:05:30.123Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Thời điểm cập nhật gần nhất',
    example: '2026-03-15T10:22:00.000Z',
  })
  updatedAt!: Date;
}
