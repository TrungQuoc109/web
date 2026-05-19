import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, Min } from 'class-validator';

export class ProjectTypingDto {
  @ApiProperty({
    example: 12,
  })
  @IsInt()
  @Min(1)
  projectId!: number;

  @ApiProperty({
    example: true,
  })
  @IsBoolean()
  isTyping!: boolean;
}
