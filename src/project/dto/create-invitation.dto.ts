import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class CreateInvitationDto {
  @IsEmail()
  @ApiProperty({
    description: 'Email người nhận lời mời',
    example: 'linh.pham@example.com',
  })
  email!: string;
}
