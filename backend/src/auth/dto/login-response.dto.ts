import { ApiProperty } from '@nestjs/swagger';
import { AuthenticatedUserResponseDto } from './authenticated-user-response.dto';

export class LoginResponseDto {
  @ApiProperty({
    description: 'Access token JWT dùng để xác thực các endpoint bảo vệ',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken!: string;

  @ApiProperty({
    description: 'Thông tin người dùng sau khi đăng nhập',
    type: AuthenticatedUserResponseDto,
  })
  user!: AuthenticatedUserResponseDto;
}
