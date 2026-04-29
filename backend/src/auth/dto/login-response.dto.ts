import { ApiProperty } from '@nestjs/swagger';
import { AuthenticatedUserResponseDto } from './authenticated-user-response.dto';

export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT access token used for protected API requests',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken!: string;

  @ApiProperty({
    description:
      'Refresh session token (opaque). Also set as an httpOnly cookie for browser clients.',
    example: 'p6l0o3lD1h7n3B6wG0l2g8jv5x... (opaque token)',
  })
  refreshToken!: string;

  @ApiProperty({
    description: 'Signed-in user information',
    type: AuthenticatedUserResponseDto,
  })
  user!: AuthenticatedUserResponseDto;
}
