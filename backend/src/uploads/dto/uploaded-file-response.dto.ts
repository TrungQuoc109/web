import { ApiProperty } from '@nestjs/swagger';

export class UploadedFileResponseDto {
  @ApiProperty({
    example: 'screenshot.png',
  })
  fileName!: string;

  @ApiProperty({
    example: '/uploads/task-reports/1713340800000-screenshot.png',
  })
  url!: string;

  @ApiProperty({
    example: 'image/png',
  })
  mimeType!: string;

  @ApiProperty({
    example: 184322,
  })
  size!: number;
}
