import { IsInt, Min } from 'class-validator';

export class JoinTaskRoomDto {
  @IsInt()
  @Min(1)
  taskId!: number;
}
