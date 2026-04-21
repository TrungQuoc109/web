import { ApiProperty } from '@nestjs/swagger';
import { InvitationStatus, ProjectRole } from '@prisma/client';

export class InvitationResponseDto {
  @ApiProperty({
    description: 'ID lời mời',
    example: 7,
  })
  id!: number;

  @ApiProperty({
    description: 'Email người được mời',
    example: 'linh.tran@example.com',
  })
  email!: string;

  @ApiProperty({
    description: 'Chuỗi token xác thực yêu cầu chấp nhận lời mời',
    example: '6b3f4c2a-9f39-4c6a-8ce0-3b8d53fb8c1e',
  })
  token!: string;

  @ApiProperty({
    description: 'ID dự án liên quan',
    example: 12,
  })
  projectId!: number;

  @ApiProperty({
    description: 'ID người tạo lời mời',
    example: 3,
  })
  senderId!: number;

  @ApiProperty({
    description: 'Trạng thái hiện tại của lời mời',
    example: InvitationStatus.PENDING,
  })
  status!: InvitationStatus;

  @ApiProperty({
    description: 'Vai trò sẽ được áp dụng khi lời mời được chấp nhận',
    example: ProjectRole.MEMBER,
  })
  role!: ProjectRole;

  @ApiProperty({
    description: 'Thời điểm lời mời hết hạn',
    example: '2026-04-15T00:00:00.000Z',
  })
  expiresAt!: Date;

  @ApiProperty({
    description: 'Thời điểm tạo lời mời',
    example: '2026-04-08T10:00:00.000Z',
  })
  createdAt!: Date;
}
