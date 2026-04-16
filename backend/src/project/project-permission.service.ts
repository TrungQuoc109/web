import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProjectRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectPermissionService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureActiveMember(projectId: number, userId: number) {
    const membership = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          projectId,
          userId,
        },
      },
    });

    if (!membership || membership.leftAt) {
      throw new ForbiddenException('You are not an active member of this project.');
    }

    return membership;
  }

  async ensureCanManageMembers(projectId: number, userId: number) {
    const membership = await this.ensureActiveMember(projectId, userId);

    const allowedRoles: ProjectRole[] = [ProjectRole.OWNER, ProjectRole.ADMIN];

    if (!allowedRoles.includes(membership.role)) {
      throw new ForbiddenException('Only owners or admins can manage project members.');
    }

    return membership;
  }

  async ensureProjectOwner(projectId: number, userId: number) {
    const membership = await this.ensureActiveMember(projectId, userId);

    if (membership.role !== ProjectRole.OWNER) {
      throw new ForbiddenException('Only project owners can perform this action.');
    }

    return membership;
  }

  async ensureProjectHasMember(projectId: number, memberId: number) {
    const membership = await this.prisma.projectMember.findUnique({
      where: { id: memberId },
    });

    if (!membership || membership.projectId !== projectId) {
      throw new NotFoundException('Project member not found.');
    }

    return membership;
  }

  async ensureNotActiveMember(projectId: number, userId: number) {
    const membership = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          projectId,
          userId,
        },
      },
    });

    if (membership && !membership.leftAt) {
      throw new ConflictException('User is already an active member.');
    }

    return membership;
  }
}
