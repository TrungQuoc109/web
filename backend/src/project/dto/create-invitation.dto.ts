import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectRole } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional } from 'class-validator';

export class CreateInvitationDto {
  @IsEmail()
  @ApiProperty({
    description: 'Email người nhận lời mời',
    example: 'linh.pham@example.com',
  })
  email!: string;

  @IsOptional()
  @IsEnum(ProjectRole)
  @ApiPropertyOptional({
    description: 'Vai trò sẽ được gán khi người nhận chấp nhận lời mời',
    enum: [ProjectRole.ADMIN, ProjectRole.MEMBER, ProjectRole.VIEWER],
    example: ProjectRole.MEMBER,
  })
  role?: ProjectRole;
}
