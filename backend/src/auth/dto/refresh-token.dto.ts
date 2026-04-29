import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description:
      'Refresh session token. When using httpOnly cookies, this field can be omitted.',
    example: 'p6l0o3lD1h7n3B6wG0l2g8jv5x... (opaque token)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(20)
  refreshToken?: string;
}
