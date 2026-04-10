import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddMemberDto } from './dto/add-member.dto';
import { ProjectMemberResponseDto } from './dto/project-member-response.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectResponseDto } from './dto/project-response.dto';
import { ProjectMemberView } from './project.types';
import { ProjectService } from './project.service';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth('bearer')
@ApiTags('Dự án')
@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo dự án mới' })
  @ApiCreatedResponse({
    description: 'Dự án được tạo thành công',
    type: ProjectResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Dữ liệu dự án không hợp lệ' })
  @ApiUnauthorizedResponse({ description: 'Thiếu token xác thực' })
  @ApiForbiddenResponse({ description: 'Không có quyền tạo dự án' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy tài nguyên liên quan' })
  createProject(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateProjectDto,
  ) {
    return this.projectService.createProject(currentUser, dto);
  }

  @Post(':projectId/members')
  @ApiOperation({ summary: 'Thêm thành viên vào dự án' })
  @ApiParam({
    name: 'projectId',
    description: 'ID của dự án',
    example: 3,
  })
  @ApiCreatedResponse({
    description: 'Thành viên đã được thêm vào dự án',
    type: ProjectMemberResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Yêu cầu thêm thành viên không hợp lệ' })
  @ApiUnauthorizedResponse({ description: 'Thiếu token hợp lệ' })
  @ApiForbiddenResponse({ description: 'Không có quyền thêm thành viên' })
  @ApiNotFoundResponse({ description: 'Dự án hoặc người dùng không tồn tại' })
  addMember(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: AddMemberDto,
  ): Promise<ProjectMemberView> {
    return this.projectService.addMember(projectId, currentUser, dto);
  }

  @Get(':projectId/members')
  @ApiOperation({ summary: 'Lấy danh sách thành viên của dự án' })
  @ApiParam({
    name: 'projectId',
    description: 'ID của dự án cần lấy thành viên',
    example: 3,
  })
  @ApiOkResponse({
    description: 'Danh sách thành viên',
    type: ProjectMemberResponseDto,
    isArray: true,
  })
  @ApiBadRequestResponse({ description: 'Tham số không hợp lệ' })
  @ApiUnauthorizedResponse({ description: 'Truy cập bị từ chối do thiếu token' })
  @ApiForbiddenResponse({ description: 'Không có quyền xem danh sách thành viên' })
  @ApiNotFoundResponse({ description: 'Dự án không tồn tại' })
  listMembers(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<ProjectMemberView[]> {
    return this.projectService.listMembers(projectId, currentUser);
  }

  @Delete(':projectId/members/:memberId')
  @ApiOperation({ summary: 'Gỡ thành viên khỏi dự án' })
  @ApiParam({
    name: 'projectId',
    description: 'ID dự án',
    example: 3,
  })
  @ApiParam({
    name: 'memberId',
    description: 'ID thành viên cần gỡ',
    example: 42,
  })
  @ApiOkResponse({
    description: 'Thành viên đã được gỡ khỏi dự án',
    type: ProjectMemberResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Tham số không hợp lệ' })
  @ApiUnauthorizedResponse({ description: 'Thiếu quyền truy cập' })
  @ApiForbiddenResponse({ description: 'Không có quyền gỡ thành viên' })
  @ApiNotFoundResponse({ description: 'Dự án hoặc thành viên không tồn tại' })
  removeMember(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<ProjectMemberView> {
    return this.projectService.removeMember(projectId, memberId, currentUser);
  }
}
