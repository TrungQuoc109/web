import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @ApiPropertyOptional({
    description: 'Tên hiển thị mới của người dùng',
    example: 'Le Thi Hang',
    nullable: true,
  })
  name?: string;

  @IsOptional()
  @IsEmail()
  @ApiPropertyOptional({
    description: 'Email đăng nhập mới của người dùng',
    example: 'hang.le@example.com',
  })
  email?: string;
}
