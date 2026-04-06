import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddMemberDto } from './dto/add-member.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { projectMemberSelect } from './project.constants';
import { ProjectMemberView, ProjectView } from './project.types';
import { ProjectPermissionService } from './project-permission.service';
import { AuthenticatedUser } from '../auth/auth.types';

@Injectable()
export class ProjectService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permission: ProjectPermissionService,
  ) {}

  async createProject(
    currentUser: AuthenticatedUser,
    dto: CreateProjectDto,
  ): Promise<ProjectView> {
    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          name: dto.name.trim(),
          description: dto.description?.trim() || null,
        },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await tx.projectMember.create({
        data: {
          projectId: project.id,
          userId: currentUser.id,
          role: 'OWNER',
        },
      });

      return project;
    });
  }

  async addMember(
    projectId: number,
    currentUser: AuthenticatedUser,
    dto: AddMemberDto,
  ): Promise<ProjectMemberView> {
    await this.permission.ensureCanManageMembers(projectId, currentUser.id);

    const normalizedEmail = dto.email.trim().toLowerCase();
    const targetUser = await this.prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found.');
    }

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.projectMember.findUnique({
        where: {
          userId_projectId: {
            projectId,
            userId: targetUser.id,
          },
        },
      });

      if (existing && existing.leftAt === null) {
        throw new ConflictException('User is already an active project member.');
      }

      if (existing) {
        return tx.projectMember.update({
          where: { id: existing.id },
          data: {
            leftAt: null,
            role: dto.role,
          },
          select: projectMemberSelect,
        });
      }

      return tx.projectMember.create({
        data: {
          projectId,
          userId: targetUser.id,
          role: dto.role,
        },
        select: projectMemberSelect,
      });
    });
  }

  async listMembers(
    projectId: number,
    currentUser: AuthenticatedUser,
  ): Promise<ProjectMemberView[]> {
    await this.permission.ensureActiveMember(projectId, currentUser.id);

    return this.prisma.projectMember.findMany({
      where: {
        projectId,
        leftAt: null,
      },
      select: projectMemberSelect,
    });
  }

  async removeMember(
    projectId: number,
    memberId: number,
    currentUser: AuthenticatedUser,
  ): Promise<ProjectMemberView> {
    await this.permission.ensureCanManageMembers(projectId, currentUser.id);
    const membership =
      await this.permission.ensureProjectHasMember(projectId, memberId);

    if (membership.leftAt) {
      throw new ConflictException('Member already removed.');
    }

    return this.prisma.projectMember.update({
      where: { id: membership.id },
      data: {
        leftAt: new Date(),
      },
      select: projectMemberSelect,
    });
  }
}
