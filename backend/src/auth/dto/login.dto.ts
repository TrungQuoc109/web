import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @ApiProperty({
    description: 'Email đăng nhập của người dùng',
    example: 'thanh.nguyen@example.com',
  })
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @ApiProperty({
    description: 'Mật khẩu (tối thiểu 8 ký tự)',
    example: 'P@ssw0rd123',
  })
  password!: string;
}
