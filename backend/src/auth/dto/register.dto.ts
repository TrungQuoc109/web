import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @ApiProperty({
    description: 'Email dùng để đăng ký tài khoản',
    example: 'hang.le@example.com',
  })
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @ApiProperty({
    description: 'Mật khẩu bảo mật (ít nhất 8 ký tự)',
    example: 'Str0ngP@ss!',
  })
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @ApiPropertyOptional({
    description: 'Tên hiển thị của người dùng',
    example: 'Lê Thị Hằng',
  })
  name?: string;
}
