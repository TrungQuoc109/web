import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { InvitationResponseDto } from './dto/invitation-response.dto';
import { ProjectMemberResponseDto } from './dto/project-member-response.dto';
import { InvitationService } from './invitation.service';
import { InvitationView } from './project.types';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth('bearer')
@ApiTags('Lời mời dự án')
@Controller()
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  @Get('projects/:projectId/invitations')
  @ApiOperation({ summary: 'Lấy danh sách lời mời của dự án' })
  @ApiParam({
    name: 'projectId',
    description: 'ID của dự án',
    example: 7,
  })
  @ApiOkResponse({
    description: 'Danh sách lời mời của dự án',
    type: InvitationResponseDto,
    isArray: true,
  })
  @ApiBadRequestResponse({ description: 'Tham số không hợp lệ' })
  @ApiUnauthorizedResponse({ description: 'Đăng nhập là bắt buộc' })
  @ApiForbiddenResponse({ description: 'Không có quyền xem lời mời của dự án' })
  @ApiNotFoundResponse({ description: 'Dự án không tồn tại' })
  listInvitations(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<InvitationView[]> {
    return this.invitationService.listInvitations(projectId, currentUser);
  }

  @Post('projects/:projectId/invitations')
  @ApiOperation({ summary: 'Tạo lời mời tham gia dự án' })
  @ApiParam({
    name: 'projectId',
    description: 'ID của dự án',
    example: 7,
  })
  @ApiCreatedResponse({
    description: 'Lời mời được tạo thành công',
    type: InvitationResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Dữ liệu lời mời không hợp lệ' })
  @ApiUnauthorizedResponse({ description: 'Đăng nhập cần thiết để gửi lời mời' })
  @ApiForbiddenResponse({ description: 'Không có quyền quản lý thành viên' })
  @ApiNotFoundResponse({ description: 'Dự án không tồn tại' })
  createInvitation(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateInvitationDto,
  ) {
    return this.invitationService.createInvitation(
      projectId,
      currentUser,
      dto,
    );
  }

  @Post('projects/:projectId/invitations/:invitationId/resend')
  @ApiOperation({ summary: 'Gửi lại lời mời tham gia dự án' })
  @ApiParam({
    name: 'projectId',
    description: 'ID của dự án',
    example: 7,
  })
  @ApiParam({
    name: 'invitationId',
    description: 'ID lời mời cần gửi lại',
    example: 19,
  })
  @ApiOkResponse({
    description: 'Lời mời đã được làm mới token và hạn dùng',
    type: InvitationResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Tham số hoặc trạng thái lời mời không hợp lệ' })
  @ApiUnauthorizedResponse({ description: 'Đăng nhập là bắt buộc' })
  @ApiForbiddenResponse({ description: 'Không có quyền quản lý lời mời của dự án' })
  @ApiNotFoundResponse({ description: 'Lời mời không tồn tại' })
  resendInvitation(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('invitationId', ParseIntPipe) invitationId: number,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<InvitationView> {
    return this.invitationService.resendInvitation(
      projectId,
      invitationId,
      currentUser,
    );
  }

  @Patch('projects/:projectId/invitations/:invitationId/cancel')
  @ApiOperation({ summary: 'Hủy lời mời tham gia dự án' })
  @ApiParam({
    name: 'projectId',
    description: 'ID của dự án',
    example: 7,
  })
  @ApiParam({
    name: 'invitationId',
    description: 'ID lời mời cần hủy',
    example: 19,
  })
  @ApiOkResponse({
    description: 'Lời mời đã được hủy',
    type: InvitationResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Tham số hoặc trạng thái lời mời không hợp lệ' })
  @ApiUnauthorizedResponse({ description: 'Đăng nhập là bắt buộc' })
  @ApiForbiddenResponse({ description: 'Không có quyền quản lý lời mời của dự án' })
  @ApiNotFoundResponse({ description: 'Lời mời không tồn tại' })
  cancelInvitation(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('invitationId', ParseIntPipe) invitationId: number,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<InvitationView> {
    return this.invitationService.cancelInvitation(
      projectId,
      invitationId,
      currentUser,
    );
  }

  @Post('invitations/:token/accept')
  @ApiOperation({ summary: 'Chấp nhận lời mời tham gia dự án' })
  @ApiParam({
    name: 'token',
    description: 'Chuỗi token xác nhận lời mời',
    example: '6b3f4c2a-9f39-4c6a-8ce0-3b8d53fb8c1e',
  })
  @ApiOkResponse({
    description: 'Người dùng đã được thêm vào dự án',
    type: ProjectMemberResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Token không hợp lệ' })
  @ApiUnauthorizedResponse({ description: 'Cần đăng nhập để chấp nhận lời mời' })
  @ApiForbiddenResponse({ description: 'Token đã hết hạn hoặc bị từ chối' })
  @ApiNotFoundResponse({ description: 'Lời mời không tồn tại' })
  acceptInvitation(
    @Param('token') token: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.invitationService.acceptInvitation(token, currentUser);
  }
}
