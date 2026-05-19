import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class TransferProjectOwnershipDto {
  @IsInt()
  @Min(1)
  @ApiProperty({
    description: 'ID membership sẽ nhận quyền owner mới',
    example: 42,
  })
  targetMemberId!: number;
}
