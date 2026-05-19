import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordResponseDto {
  @ApiProperty({
    description: 'Thông báo kết quả đổi mật khẩu',
    example: 'Password updated successfully.',
  })
  message!: string;
}
