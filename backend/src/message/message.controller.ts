import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
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
import { ListMessagesQueryDto } from './dto/list-messages-query.dto';
import { MessageCatalogResponseDto } from './dto/message-catalog-response.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { MessageService } from './message.service';
import { MessageCatalogView, MessageView } from './message.types';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth('bearer')
@ApiTags('Tin nhắn')
@Controller()
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post('projects/:projectId/messages')
  @ApiOperation({ summary: 'Gửi tin nhắn trong dự án' })
  @ApiParam({
    name: 'projectId',
    description: 'ID dự án gửi tin nhắn',
    example: 12,
  })
  @ApiCreatedResponse({
    description: 'Tin nhắn đã được gửi',
    type: MessageResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Dữ liệu tin nhắn không hợp lệ' })
  @ApiUnauthorizedResponse({ description: 'Yêu cầu cần đáng tin cậy' })
  @ApiForbiddenResponse({ description: 'Không có quyền gửi tin nhắn này' })
  @ApiNotFoundResponse({ description: 'Dự án không tồn tại' })
  sendProjectMessage(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: SendMessageDto,
  ): Promise<MessageView> {
    return this.messageService.sendProjectMessage(projectId, currentUser, dto);
  }

  @Get('projects/:projectId/messages')
  @ApiOperation({ summary: 'Lấy danh sách tin nhắn dự án' })
  @ApiParam({
    name: 'projectId',
    description: 'ID dự án cần lấy tin nhắn',
    example: 12,
  })
  @ApiOkResponse({
    description: 'Danh sách tin nhắn theo dự án',
    type: MessageResponseDto,
    isArray: true,
  })
  @ApiBadRequestResponse({ description: 'Tham số không hợp lệ' })
  @ApiUnauthorizedResponse({ description: 'Không có token hợp lệ' })
  @ApiForbiddenResponse({ description: 'Không có quyền xem tin nhắn' })
  @ApiNotFoundResponse({ description: 'Dự án không tồn tại' })
  listProjectMessages(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<MessageView[]> {
    return this.messageService.listProjectMessages(projectId, currentUser);
  }

  @Get('projects/:projectId/messages/catalog')
  @ApiOperation({ summary: 'Lấy lịch sử tin nhắn dự án có phân trang và tìm kiếm' })
  @ApiParam({
    name: 'projectId',
    description: 'ID dự án cần lấy tin nhắn',
    example: 12,
  })
  @ApiOkResponse({
    description: 'Lịch sử tin nhắn theo dự án có phân trang',
    type: MessageCatalogResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Tham số không hợp lệ' })
  @ApiUnauthorizedResponse({ description: 'Không có token hợp lệ' })
  @ApiForbiddenResponse({ description: 'Không có quyền xem tin nhắn' })
  @ApiNotFoundResponse({ description: 'Dự án không tồn tại' })
  listProjectMessagesCatalog(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListMessagesQueryDto,
  ): Promise<MessageCatalogView> {
    return this.messageService.listProjectMessagesCatalog(
      projectId,
      currentUser,
      query,
    );
  }

  @Post('tasks/:taskId/messages')
  @ApiOperation({ summary: 'Gửi tin nhắn trong công việc' })
  @ApiParam({
    name: 'taskId',
    description: 'ID công việc gửi tin nhắn',
    example: 103,
  })
  @ApiCreatedResponse({
    description: 'Tin nhắn đã được gửi thành công',
    type: MessageResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Dữ liệu tin nhắn không hợp lệ' })
  @ApiUnauthorizedResponse({ description: 'Yêu cầu cần xác thực' })
  @ApiForbiddenResponse({ description: 'Không có quyền gửi tin nhắn công việc' })
  @ApiNotFoundResponse({ description: 'Công việc không tồn tại' })
  sendTaskMessage(
    @Param('taskId', ParseIntPipe) taskId: number,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: SendMessageDto,
  ): Promise<MessageView> {
    return this.messageService.sendTaskMessage(taskId, currentUser, dto);
  }

  @Get('tasks/:taskId/messages')
  @ApiOperation({ summary: 'Liệt kê tin nhắn theo công việc' })
  @ApiParam({
    name: 'taskId',
    description: 'ID công việc để lấy tin nhắn',
    example: 103,
  })
  @ApiOkResponse({
    description: 'Danh sách tin nhắn theo công việc',
    type: MessageResponseDto,
    isArray: true,
  })
  @ApiBadRequestResponse({ description: 'Tham số không hợp lệ' })
  @ApiUnauthorizedResponse({ description: 'Thiếu token xác thực' })
  @ApiForbiddenResponse({ description: 'Không có quyền xem tin nhắn' })
  @ApiNotFoundResponse({ description: 'Công việc không tồn tại' })
  listTaskMessages(
    @Param('taskId', ParseIntPipe) taskId: number,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<MessageView[]> {
    return this.messageService.listTaskMessages(taskId, currentUser);
  }

  @Get('tasks/:taskId/messages/catalog')
  @ApiOperation({ summary: 'Liệt kê lịch sử tin nhắn công việc có phân trang và tìm kiếm' })
  @ApiParam({
    name: 'taskId',
    description: 'ID công việc để lấy lịch sử tin nhắn',
    example: 103,
  })
  @ApiOkResponse({
    description: 'Lịch sử tin nhắn theo công việc có phân trang',
    type: MessageCatalogResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Tham số không hợp lệ' })
  @ApiUnauthorizedResponse({ description: 'Thiếu token xác thực' })
  @ApiForbiddenResponse({ description: 'Không có quyền xem tin nhắn' })
  @ApiNotFoundResponse({ description: 'Công việc không tồn tại' })
  listTaskMessagesCatalog(
    @Param('taskId', ParseIntPipe) taskId: number,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListMessagesQueryDto,
  ): Promise<MessageCatalogView> {
    return this.messageService.listTaskMessagesCatalog(taskId, currentUser, query);
  }
}
