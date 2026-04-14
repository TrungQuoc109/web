import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/auth.types';
import { AssignTaskUsersDto } from './dto/assign-task-users.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskResponseDto } from './dto/task-response.dto';
import { TaskAssignmentResponseDto } from './dto/task-assignment-response.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { TaskAssignmentView, TaskView } from './task.types';
import { TaskService } from './task.service';

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
    type: TaskResponseDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({ description: 'Thiếu token hợp lệ' })
  @ApiForbiddenResponse({ description: 'Không có quyền xem danh sách công việc' })
  listTasks(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<TaskView[]> {
    return this.taskService.listTasks(currentUser);
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

  @Patch('tasks/:taskId/status')
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
}
