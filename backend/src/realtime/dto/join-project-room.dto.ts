import { IsInt, Min } from 'class-validator';

export class JoinProjectRoomDto {
  @IsInt()
  @Min(1)
  projectId!: number;
}
