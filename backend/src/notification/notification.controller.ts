import { Controller, Get, Param, ParseIntPipe, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationService } from './notification.service';
import { NotificationView } from './notification.types';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { UnreadCountResponseDto } from './dto/unread-count-response.dto';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth('bearer')
@ApiTags('Thông báo')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Patch(':notificationId/read')
  @ApiOperation({ summary: 'Đánh dấu thông báo là đã đọc' })
  @ApiParam({
    name: 'notificationId',
    description: 'ID thông báo cần đánh dấu',
    example: 322,
  })
  @ApiOkResponse({
    description: 'Thông báo đã được cập nhật trạng thái',
    type: NotificationResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Tham số không hợp lệ' })
  @ApiUnauthorizedResponse({ description: 'Thiếu token hợp lệ' })
  @ApiForbiddenResponse({ description: 'Không đủ quyền truy cập thông báo' })
  @ApiNotFoundResponse({ description: 'Thông báo không tồn tại' })
  markAsRead(
    @Param('notificationId', ParseIntPipe) notificationId: number,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<NotificationView> {
    return this.notificationService.markAsRead(notificationId, currentUser.id);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Lấy tổng số thông báo chưa đọc' })
  @ApiOkResponse({
    description: 'Số lượng thông báo chưa đọc',
    type: UnreadCountResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Không có quyền truy cập' })
  @ApiForbiddenResponse({ description: 'Không đủ quyền truy cập thông tin' })
  getUnreadCount(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.notificationService.getUnreadCount(currentUser.id);
  }
}
