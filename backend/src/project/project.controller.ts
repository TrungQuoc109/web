import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddMemberDto } from './dto/add-member.dto';
import { ProjectMemberResponseDto } from './dto/project-member-response.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { ListProjectCatalogQueryDto } from './dto/list-project-catalog-query.dto';
import { ListProjectMembersQueryDto } from './dto/list-project-members-query.dto';
import { ProjectActivityResponseDto } from './dto/project-activity-response.dto';
import { ProjectResponseDto } from './dto/project-response.dto';
import { TransferProjectOwnershipDto } from './dto/transfer-project-ownership.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UpdateProjectMemberRoleDto } from './dto/update-project-member-role.dto';
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

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách dự án của người dùng hiện tại' })
  @ApiOkResponse({
    description: 'Danh sách dự án đang tham gia',
  })
  @ApiUnauthorizedResponse({ description: 'Thiếu token xác thực' })
  @ApiForbiddenResponse({ description: 'Không có quyền xem dự án' })
  listProjects(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.projectService.listProjects(currentUser);
  }

  @Get('catalog')
  @ApiOperation({ summary: 'Lấy danh sách dự án có hỗ trợ lọc và phân trang' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Tìm kiếm theo tên hoặc mô tả dự án',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['ACTIVE', 'PLANNING', 'AT_RISK', 'COMPLETED'],
    description: 'Lọc theo trạng thái tổng hợp của dự án',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Trang hiện tại',
    example: 1,
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    description: 'Số lượng dự án mỗi trang',
    example: 9,
  })
  @ApiOkResponse({
    description: 'Danh sách dự án đã được lọc và phân trang',
  })
  @ApiUnauthorizedResponse({ description: 'Thiếu token xác thực' })
  @ApiForbiddenResponse({ description: 'Không có quyền xem dự án' })
  listProjectCatalog(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListProjectCatalogQueryDto,
  ) {
    return this.projectService.listProjectCatalog(currentUser, query);
  }

  @Get(':projectId')
  @ApiOperation({ summary: 'Lấy chi tiết một dự án' })
  @ApiParam({
    name: 'projectId',
    description: 'ID của dự án',
    example: 3,
  })
  @ApiOkResponse({
    description: 'Chi tiết dự án',
  })
  @ApiUnauthorizedResponse({ description: 'Thiếu token xác thực' })
  @ApiForbiddenResponse({ description: 'Không có quyền xem dự án này' })
  @ApiNotFoundResponse({ description: 'Dự án không tồn tại' })
  getProjectDetail(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.projectService.getProjectDetail(projectId, currentUser);
  }

  @Get(':projectId/activity')
  @ApiOperation({ summary: 'Lấy timeline hoạt động của dự án' })
  @ApiParam({
    name: 'projectId',
    description: 'ID của dự án',
    example: 3,
  })
  @ApiOkResponse({
    description: 'Timeline hoạt động gần đây của dự án',
    type: ProjectActivityResponseDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({ description: 'Thiếu token xác thực' })
  @ApiForbiddenResponse({ description: 'Không có quyền xem hoạt động dự án' })
  @ApiNotFoundResponse({ description: 'Dự án không tồn tại' })
  getProjectActivity(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.projectService.getProjectActivity(projectId, currentUser);
  }

  @Patch(':projectId')
  @ApiOperation({ summary: 'Cập nhật thông tin dự án' })
  @ApiParam({
    name: 'projectId',
    description: 'ID của dự án cần cập nhật',
    example: 3,
  })
  @ApiOkResponse({
    description: 'Dự án đã được cập nhật',
    type: ProjectResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Dữ liệu cập nhật không hợp lệ' })
  @ApiUnauthorizedResponse({ description: 'Thiếu token xác thực' })
  @ApiForbiddenResponse({ description: 'Không có quyền cập nhật dự án' })
  @ApiNotFoundResponse({ description: 'Dự án không tồn tại' })
  updateProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectService.updateProject(projectId, currentUser, dto);
  }

  @Delete(':projectId')
  @ApiOperation({ summary: 'Xóa dự án' })
  @ApiParam({
    name: 'projectId',
    description: 'ID của dự án cần xóa',
    example: 3,
  })
  @ApiOkResponse({
    description: 'Dự án đã được xóa',
    type: ProjectResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Tham số không hợp lệ' })
  @ApiUnauthorizedResponse({ description: 'Thiếu token xác thực' })
  @ApiForbiddenResponse({ description: 'Không có quyền xóa dự án' })
  @ApiNotFoundResponse({ description: 'Dự án không tồn tại' })
  deleteProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.projectService.deleteProject(projectId, currentUser);
  }

  @Post(':projectId/leave')
  @ApiOperation({ summary: 'Rời khỏi dự án hiện tại' })
  @ApiParam({
    name: 'projectId',
    description: 'ID dự án cần rời khỏi',
    example: 3,
  })
  @ApiOkResponse({
    description: 'Thành viên đã rời khỏi dự án',
    type: ProjectMemberResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Tham số không hợp lệ' })
  @ApiUnauthorizedResponse({ description: 'Thiếu token xác thực' })
  @ApiForbiddenResponse({ description: 'Không có quyền rời dự án này' })
  @ApiNotFoundResponse({ description: 'Dự án không tồn tại' })
  leaveProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<ProjectMemberView> {
    return this.projectService.leaveProject(projectId, currentUser);
  }

  @Post(':projectId/ownership-transfer')
  @ApiOperation({ summary: 'Chuyển quyền owner cho thành viên khác' })
  @ApiParam({
    name: 'projectId',
    description: 'ID dự án cần chuyển owner',
    example: 3,
  })
  @ApiOkResponse({
    description: 'Owner mới đã được cập nhật',
    type: ProjectMemberResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Dữ liệu chuyển owner không hợp lệ' })
  @ApiUnauthorizedResponse({ description: 'Thiếu token xác thực' })
  @ApiForbiddenResponse({ description: 'Không có quyền chuyển owner' })
  @ApiNotFoundResponse({ description: 'Dự án hoặc thành viên không tồn tại' })
  transferOwnership(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: TransferProjectOwnershipDto,
  ): Promise<ProjectMemberView> {
    return this.projectService.transferOwnership(projectId, currentUser, dto);
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
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Tìm kiếm theo tên hoặc email thành viên',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'],
    description: 'Lọc theo vai trò thành viên trong dự án',
  })
  @ApiBadRequestResponse({ description: 'Tham số không hợp lệ' })
  @ApiUnauthorizedResponse({ description: 'Truy cập bị từ chối do thiếu token' })
  @ApiForbiddenResponse({ description: 'Không có quyền xem danh sách thành viên' })
  @ApiNotFoundResponse({ description: 'Dự án không tồn tại' })
  listMembers(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListProjectMembersQueryDto,
  ): Promise<ProjectMemberView[]> {
    return this.projectService.listMembers(projectId, currentUser, query);
  }

  @Patch(':projectId/members/:memberId')
  @ApiOperation({ summary: 'Cập nhật vai trò thành viên trong dự án' })
  @ApiParam({
    name: 'projectId',
    description: 'ID dự án',
    example: 3,
  })
  @ApiParam({
    name: 'memberId',
    description: 'ID thành viên cần cập nhật vai trò',
    example: 42,
  })
  @ApiOkResponse({
    description: 'Vai trò thành viên đã được cập nhật',
    type: ProjectMemberResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Dữ liệu cập nhật vai trò không hợp lệ' })
  @ApiUnauthorizedResponse({ description: 'Thiếu quyền truy cập' })
  @ApiForbiddenResponse({ description: 'Không có quyền cập nhật vai trò thành viên' })
  @ApiNotFoundResponse({ description: 'Dự án hoặc thành viên không tồn tại' })
  updateMemberRole(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: UpdateProjectMemberRoleDto,
  ): Promise<ProjectMemberView> {
    return this.projectService.updateMemberRole(
      projectId,
      memberId,
      currentUser,
      dto,
    );
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
