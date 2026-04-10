import { IsBoolean, IsInt, IsObject, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class SocketMessageCreateDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  projectId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  taskId?: number;

  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  content!: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isAnnouncement?: boolean;
}
