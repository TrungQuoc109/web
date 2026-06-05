import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ProjectRole } from '@prisma/client';
import { TaskPermissionService } from '../task-permission.service';
import { ProjectPermissionService } from '../../project/project-permission.service';
import { PROJECT_ROLES_KEY } from '../../project/decorators/project-roles.decorator';

@Injectable()
export class TaskRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly taskPermissionService: TaskPermissionService,
    private readonly projectPermissionService: ProjectPermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<ProjectRole[]>(PROJECT_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      return false;
    }

    const taskId = parseInt(request.params.taskId, 10);
    if (isNaN(taskId)) {
      throw new BadRequestException('Invalid task ID parameter.');
    }

    const task = await this.taskPermissionService.ensureTaskExists(taskId);
    const membership = await this.projectPermissionService.ensureActiveMember(
      task.projectId,
      user.id,
    );

    if (requiredRoles && requiredRoles.length > 0) {
      if (!requiredRoles.includes(membership.role)) {
        throw new ForbiddenException(
          `Required project roles: [${requiredRoles.join(', ')}]. Your role: ${membership.role}`,
        );
      }
    }

    request.task = task;
    request.projectMembership = membership;
    return true;
  }
}
