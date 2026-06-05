import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/auth.types';
import { AssignTaskUsersDto } from './dto/assign-task-users.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto';
import { TaskCatalogResponseDto } from './dto/task-catalog-response.dto';
import { TaskResponseDto } from './dto/task-response.dto';
import { TaskAssignmentResponseDto } from './dto/task-assignment-response.dto';
import { UpdateTaskAssignmentDto } from './dto/update-task-assignment.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { TaskAssignmentView, TaskCatalogView, TaskView } from './task.types';
import { TaskService } from './task.service';
import { TaskRoleGuard } from './guards/task-role.guard';
import { ProjectRoles } from '../project/decorators/project-roles.decorator';
import { ProjectRole } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth('bearer')
@ApiTags('Công việc/Task')
@Controller()
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Get('tasks')
  @ApiOperation({ summary: 'Lấy danh sách công việc của người dùng hiện tại' })
  @ApiOkResponse({
    description: 'Danh sách công việc trong các dự án người dùng đang tham gia',
    type: TaskCatalogResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Thiếu token hợp lệ' })
  @ApiForbiddenResponse({ description: 'Không có quyền xem danh sách công việc' })
  listTasks(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListTasksQueryDto,
  ): Promise<TaskCatalogView> {
    return this.taskService.listTasks(currentUser, query);
  }

  @Post('projects/:projectId/tasks')
  @ApiOperation({ summary: 'Tạo công việc mới trong dự án' })
  @ApiParam({
    name: 'projectId',
    description: 'ID dự án chứa công việc',
    example: 12,
  })
  @ApiCreatedResponse({
    description: 'Công việc đã được tạo',
    type: TaskResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Thông tin công việc không hợp lệ' })
  @ApiUnauthorizedResponse({ description: 'Thiếu token hợp lệ' })
  @ApiForbiddenResponse({ description: 'Không có quyền tạo công việc' })
  @ApiNotFoundResponse({ description: 'Dự án không tồn tại' })
  createTask(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateTaskDto,
  ): Promise<TaskView> {
    return this.taskService.createTask(projectId, currentUser, dto);
  }

  @Post('tasks/:taskId/assignments')
  @UseGuards(TaskRoleGuard)
  @ProjectRoles(ProjectRole.OWNER, ProjectRole.ADMIN, ProjectRole.MEMBER)
  @ApiOperation({ summary: 'Phân công thành viên cho công việc' })
  @ApiParam({
    name: 'taskId',
    description: 'ID công việc cần phân công',
    example: 103,
  })
  @ApiCreatedResponse({
    description: 'Danh sách phân công sau khi đã thêm',
    type: TaskAssignmentResponseDto,
    isArray: true,
  })
  @ApiBadRequestResponse({ description: 'Yêu cầu phân công không hợp lệ' })
  @ApiUnauthorizedResponse({ description: 'Không có quyền truy cập' })
  @ApiForbiddenResponse({ description: 'Không đủ quyền phân công người khác' })
  @ApiNotFoundResponse({ description: 'Công việc không tồn tại' })
  assignUsers(
    @Param('taskId', ParseIntPipe) taskId: number,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: AssignTaskUsersDto,
  ): Promise<TaskAssignmentView[]> {
    return this.taskService.assignUsers(taskId, currentUser, dto);
  }

  @Patch('tasks/:taskId/assignments/:assignmentId')
  @UseGuards(TaskRoleGuard)
  @ProjectRoles(ProjectRole.OWNER, ProjectRole.ADMIN, ProjectRole.MEMBER)
  @ApiOperation({ summary: 'Cập nhật vai trò phân công trong công việc' })
  @ApiParam({
    name: 'taskId',
    description: 'ID công việc chứa phân công',
    example: 103,
  })
  @ApiParam({
    name: 'assignmentId',
    description: 'ID bản ghi phân công cần cập nhật',
    example: 88,
  })
  @ApiOkResponse({
    description: 'Phân công đã được cập nhật vai trò',
    type: TaskAssignmentResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Dữ liệu phân công không hợp lệ' })
  @ApiUnauthorizedResponse({ description: 'Không có quyền truy cập' })
  @ApiForbiddenResponse({ description: 'Không đủ quyền cập nhật phân công' })
  @ApiNotFoundResponse({ description: 'Phân công công việc không tồn tại' })
  updateAssignment(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: UpdateTaskAssignmentDto,
  ): Promise<TaskAssignmentView> {
    return this.taskService.updateAssignment(
      taskId,
      assignmentId,
      currentUser,
      dto,
    );
  }

  @Delete('tasks/:taskId/assignments/:assignmentId')
  @UseGuards(TaskRoleGuard)
  @ProjectRoles(ProjectRole.OWNER, ProjectRole.ADMIN, ProjectRole.MEMBER)
  @ApiOperation({ summary: 'Gỡ phân công người dùng khỏi công việc' })
  @ApiParam({
    name: 'taskId',
    description: 'ID công việc chứa phân công',
    example: 103,
  })
  @ApiParam({
    name: 'assignmentId',
    description: 'ID bản ghi phân công cần gỡ',
    example: 88,
  })
  @ApiOkResponse({
    description: 'Phân công đã được gỡ khỏi công việc',
    type: TaskAssignmentResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Tham số không hợp lệ' })
  @ApiUnauthorizedResponse({ description: 'Không có quyền truy cập' })
  @ApiForbiddenResponse({ description: 'Không đủ quyền gỡ phân công' })
  @ApiNotFoundResponse({ description: 'Phân công công việc không tồn tại' })
  removeAssignment(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<TaskAssignmentView> {
    return this.taskService.removeAssignment(taskId, assignmentId, currentUser);
  }

  @Patch('tasks/:taskId/status')
  @UseGuards(TaskRoleGuard)
  @ProjectRoles(ProjectRole.OWNER, ProjectRole.ADMIN, ProjectRole.MEMBER)
  @ApiOperation({ summary: 'Cập nhật trạng thái công việc' })
  @ApiParam({
    name: 'taskId',
    description: 'ID công việc cần cập nhật',
    example: 103,
  })
  @ApiOkResponse({
    description: 'Trạng thái công việc đã được thay đổi',
    type: TaskResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Trạng thái không hợp lệ' })
  @ApiUnauthorizedResponse({ description: 'Không có quyền truy cập' })
  @ApiForbiddenResponse({ description: 'Không có quyền thay đổi trạng thái' })
  @ApiNotFoundResponse({ description: 'Công việc không tồn tại' })
  updateStatus(
    @Param('taskId', ParseIntPipe) taskId: number,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: UpdateTaskStatusDto,
  ): Promise<TaskView> {
    return this.taskService.updateStatus(taskId, currentUser, dto);
  }

  @Patch('tasks/:taskId')
  @UseGuards(TaskRoleGuard)
  @ProjectRoles(ProjectRole.OWNER, ProjectRole.ADMIN, ProjectRole.MEMBER)
  @ApiOperation({ summary: 'Cập nhật thông tin công việc' })
  @ApiParam({
    name: 'taskId',
    description: 'ID công việc cần cập nhật',
    example: 103,
  })
  @ApiOkResponse({
    description: 'Công việc đã được cập nhật',
    type: TaskResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Dữ liệu công việc không hợp lệ' })
  @ApiUnauthorizedResponse({ description: 'Không có quyền truy cập' })
  @ApiForbiddenResponse({ description: 'Không có quyền cập nhật công việc' })
  @ApiNotFoundResponse({ description: 'Công việc không tồn tại' })
  updateTask(
    @Param('taskId', ParseIntPipe) taskId: number,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: UpdateTaskDto,
  ): Promise<TaskView> {
    return this.taskService.updateTask(taskId, currentUser, dto);
  }

  @Delete('tasks/:taskId')
  @UseGuards(TaskRoleGuard)
  @ProjectRoles(ProjectRole.OWNER, ProjectRole.ADMIN, ProjectRole.MEMBER)
  @ApiOperation({ summary: 'Xóa công việc' })
  @ApiParam({
    name: 'taskId',
    description: 'ID công việc cần xóa',
    example: 103,
  })
  @ApiOkResponse({
    description: 'Công việc đã được xóa',
    type: TaskResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Tham số không hợp lệ' })
  @ApiUnauthorizedResponse({ description: 'Không có quyền truy cập' })
  @ApiForbiddenResponse({ description: 'Không có quyền xóa công việc' })
  @ApiNotFoundResponse({ description: 'Công việc không tồn tại' })
  deleteTask(
    @Param('taskId', ParseIntPipe) taskId: number,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<TaskView> {
    return this.taskService.deleteTask(taskId, currentUser);
  }
}
