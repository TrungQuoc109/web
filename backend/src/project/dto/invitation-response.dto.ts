import { ApiProperty } from '@nestjs/swagger';
import { InvitationStatus, ProjectRole } from '@prisma/client';

export class InvitationResponseDto {
  @ApiProperty({
    description: 'Invitation id',
    example: 7,
  })
  id!: number;

  @ApiProperty({
    description: 'Invitee email',
    example: 'linh.tran@example.com',
  })
  email!: string;

  @ApiProperty({
    description:
      'Raw invitation token. Returned only on create/resend responses (not included in list responses).',
    example: '6b3f4c2a-9f39-4c6a-8ce0-3b8d53fb8c1e',
    required: false,
  })
  token?: string;

  @ApiProperty({
    description:
      'Safe token preview (for UI display). This does not grant access to accept the invitation.',
    example: 'fb8c1e',
    nullable: true,
  })
  tokenPreview!: string | null;

  @ApiProperty({
    description: 'Project id',
    example: 12,
  })
  projectId!: number;

  @ApiProperty({
    description: 'Invitation sender user id',
    example: 3,
  })
  senderId!: number;

  @ApiProperty({
    description: 'Invitation status',
    example: InvitationStatus.PENDING,
  })
  status!: InvitationStatus;

  @ApiProperty({
    description: 'Role granted upon acceptance',
    example: ProjectRole.MEMBER,
  })
  role!: ProjectRole;

  @ApiProperty({
    description: 'Expiration timestamp',
    example: '2026-04-15T00:00:00.000Z',
  })
  expiresAt!: Date;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2026-04-08T10:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Timestamp of the latest token issuance (create/resend)',
    example: '2026-04-08T10:00:00.000Z',
  })
  sentAt!: Date;
}

