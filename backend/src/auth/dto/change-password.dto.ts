import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @ApiProperty({
    description: 'Mật khẩu hiện tại của người dùng',
    example: 'DemoPass!123',
  })
  currentPassword!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @ApiProperty({
    description: 'Mật khẩu mới của người dùng',
    example: 'NewPass!456',
  })
  newPassword!: string;
}
