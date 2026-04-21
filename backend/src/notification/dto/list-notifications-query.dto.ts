import { ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export enum NotificationReadState {
  ALL = 'ALL',
  READ = 'READ',
  UNREAD = 'UNREAD',
}

export class ListNotificationsQueryDto {
  @ApiPropertyOptional({
    description: 'Trang hiện tại',
    example: 1,
    default: 1,
  })
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({
    description: 'Số thông báo mỗi trang',
    example: 20,
    default: 20,
  })
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20;

  @ApiPropertyOptional({
    description: 'Lọc theo trạng thái đã đọc',
    enum: NotificationReadState,
    default: NotificationReadState.ALL,
  })
  @IsOptional()
  @IsEnum(NotificationReadState)
  readState: NotificationReadState = NotificationReadState.ALL;

  @ApiPropertyOptional({
    description: 'Lọc theo loại thông báo',
    enum: NotificationType,
  })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;
}
