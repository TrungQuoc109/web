import {
  Body,
  Controller,
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
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReviewTaskReportDto } from './dto/review-task-report.dto';
import { SubmitTaskReportDto } from './dto/submit-task-report.dto';
import { TaskReportResponseDto } from './dto/task-report-response.dto';
import { TaskReportView } from './task-report.types';
import { TaskReportService } from './task-report.service';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth('bearer')
@ApiTags('Báo cáo công việc')
@Controller()
export class TaskReportController {
  constructor(private readonly taskReportService: TaskReportService) {}

  @Post('tasks/:taskId/reports')
  @ApiOperation({ summary: 'Gửi báo cáo công việc' })
  @ApiParam({
    name: 'taskId',
    description: 'ID công việc cần gửi báo cáo',
    example: 103,
  })
  @ApiCreatedResponse({
    description: 'Báo cáo đã được ghi nhận',
    type: TaskReportResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Đầu vào báo cáo không hợp lệ' })
  @ApiUnauthorizedResponse({ description: 'Yêu cầu cần xác thực' })
  @ApiForbiddenResponse({ description: 'Không có quyền gửi báo cáo' })
  @ApiNotFoundResponse({ description: 'Công việc không tồn tại' })
  submitReport(
    @Param('taskId', ParseIntPipe) taskId: number,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: SubmitTaskReportDto,
  ): Promise<TaskReportView> {
    return this.taskReportService.submitReport(taskId, currentUser, dto);
  }

  @Patch('task-reports/:reportId/review')
  @ApiOperation({ summary: 'Đánh giá báo cáo công việc' })
  @ApiParam({
    name: 'reportId',
    description: 'ID báo cáo cần đánh giá',
    example: 57,
  })
  @ApiOkResponse({
    description: 'Báo cáo cập nhật trạng thái sau khi duyệt',
    type: TaskReportResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Dữ liệu duyệt không hợp lệ' })
  @ApiUnauthorizedResponse({ description: 'Không có token hợp lệ' })
  @ApiForbiddenResponse({ description: 'Không có quyền duyệt báo cáo' })
  @ApiNotFoundResponse({ description: 'Báo cáo không tồn tại' })
  reviewReport(
    @Param('reportId', ParseIntPipe) reportId: number,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: ReviewTaskReportDto,
  ): Promise<TaskReportView> {
    return this.taskReportService.reviewReport(reportId, currentUser, dto);
  }
}
