import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardOverviewResponseDto } from './dto/dashboard-overview-response.dto';
import { DashboardService } from './dashboard.service';
import { DashboardOverviewView } from './dashboard.types';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth('bearer')
@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get dashboard overview for the authenticated user' })
  @ApiOkResponse({
    description: 'Dashboard overview cards and recent activity',
    type: DashboardOverviewResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  @ApiForbiddenResponse({ description: 'Access to the dashboard is forbidden' })
  getOverview(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<DashboardOverviewView> {
    return this.dashboardService.getOverview(currentUser);
  }
}
