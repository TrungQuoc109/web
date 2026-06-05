import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ProjectRole } from '@prisma/client';
import { ProjectPermissionService } from '../project-permission.service';
import { PROJECT_ROLES_KEY } from '../decorators/project-roles.decorator';

@Injectable()
export class ProjectRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly projectPermissionService: ProjectPermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<ProjectRole[]>(PROJECT_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      return false;
    }

    const projectId = parseInt(request.params.projectId, 10);
    if (isNaN(projectId)) {
      throw new BadRequestException('Invalid project ID parameter.');
    }

    const membership = await this.projectPermissionService.ensureActiveMember(
      projectId,
      user.id,
    );

    if (!requiredRoles.includes(membership.role)) {
      throw new ForbiddenException(
        `Required project roles: [${requiredRoles.join(', ')}]. Your role: ${membership.role}`,
      );
    }

    request.projectMembership = membership;
    return true;
  }
}
