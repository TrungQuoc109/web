import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProjectRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectPermissionService } from './project-permission.service';
import { AuthenticatedUser } from '../auth/auth.types';
import { AddMemberDto } from './dto/add-member.dto';
import { TransferProjectOwnershipDto } from './dto/transfer-project-ownership.dto';
import { UpdateProjectMemberRoleDto } from './dto/update-project-member-role.dto';
import { ListProjectMembersQueryDto } from './dto/list-project-members-query.dto';
import { projectMemberSelect } from './project.constants';
import { ProjectMemberView } from './project.types';
import {
  MessageEventNames,
  ProjectOwnershipTransferredEvent,
  ProjectMemberReactivatedEvent,
  ProjectMemberAddedEvent,
  ProjectMemberRoleChangedEvent,
  ProjectMemberRemovedEvent,
} from '../message/events/message.events';

@Injectable()
export class ProjectMemberService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permission: ProjectPermissionService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Rời khỏi dự án hiện tại (dành cho thành viên tự thực hiện)
   */
  async leaveProject(
    projectId: number,
    currentUser: AuthenticatedUser,
  ): Promise<ProjectMemberView> {
    const membership = await this.permission.ensureActiveMember(
      projectId,
      currentUser.id,
    );

    if (membership.role === ProjectRole.OWNER) {
      throw new ConflictException(
        'Project owners must transfer ownership before leaving the project.',
      );
    }

    return this.prisma.projectMember.update({
      where: { id: membership.id },
      data: {
        leftAt: new Date(),
      },
      select: projectMemberSelect,
    });
  }

  /**
   * Chuyển quyền OWNER sang cho một thành viên khác trong dự án
   */
  async transferOwnership(
    projectId: number,
    currentUser: AuthenticatedUser,
    dto: TransferProjectOwnershipDto,
  ): Promise<ProjectMemberView> {
    const ownerMembership = await this.permission.ensureProjectOwner(
      projectId,
      currentUser.id,
    );
    const targetMembership = await this.permission.ensureProjectHasMember(
      projectId,
      dto.targetMemberId,
    );
    const targetUser = await this.prisma.user.findUniqueOrThrow({
      where: {
        id: targetMembership.userId,
      },
      select: {
        email: true,
      },
    });

    if (targetMembership.leftAt) {
      throw new ConflictException('Cannot transfer ownership to an inactive member.');
    }

    if (targetMembership.id === ownerMembership.id) {
      throw new ConflictException('Select a different member to transfer ownership.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.projectMember.update({
        where: { id: ownerMembership.id },
        data: {
          role: ProjectRole.ADMIN,
        },
      });

      await tx.projectMember.update({
        where: { id: targetMembership.id },
        data: {
          role: ProjectRole.OWNER,
        },
      });
    });

    this.eventEmitter.emit(
      MessageEventNames.PROJECT_OWNERSHIP_TRANSFERRED,
      new ProjectOwnershipTransferredEvent(
        projectId,
        currentUser.id,
        targetMembership.userId,
        currentUser.email,
        targetUser.email,
      ),
    );

    return this.prisma.projectMember.findUniqueOrThrow({
      where: { id: targetMembership.id },
      select: projectMemberSelect,
    });
  }

  /**
   * Thêm thành viên mới vào dự án (hoặc kích hoạt lại nếu đã từng tham gia)
   */
  async addMember(
    projectId: number,
    currentUser: AuthenticatedUser,
    dto: AddMemberDto,
  ): Promise<ProjectMemberView> {
    await this.permission.ensureCanManageMembers(projectId, currentUser.id);

    if (dto.role === ProjectRole.OWNER) {
      throw new ConflictException(
        'Project ownership cannot be granted through adding a member.',
      );
    }

    const normalizedEmail = dto.email.trim().toLowerCase();
    const targetUser = await this.prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found.');
    }

    const { member, isReactivated } = await this.prisma.$transaction(async (tx) => {
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
        const member = await tx.projectMember.update({
          where: { id: existing.id },
          data: {
            leftAt: null,
            role: dto.role,
          },
          select: projectMemberSelect,
        });

        return { member, isReactivated: true };
      }

      const member = await tx.projectMember.create({
        data: {
          projectId,
          userId: targetUser.id,
          role: dto.role,
        },
        select: projectMemberSelect,
      });

      return { member, isReactivated: false };
    });

    if (isReactivated) {
      this.eventEmitter.emit(
        MessageEventNames.PROJECT_MEMBER_REACTIVATED,
        new ProjectMemberReactivatedEvent(
          projectId,
          targetUser.id,
          dto.role,
          currentUser.id,
          currentUser.email,
          targetUser.email,
        ),
      );
    } else {
      this.eventEmitter.emit(
        MessageEventNames.PROJECT_MEMBER_ADDED,
        new ProjectMemberAddedEvent(
          projectId,
          targetUser.id,
          dto.role,
          currentUser.id,
          currentUser.email,
          targetUser.email,
        ),
      );
    }

    return member;
  }

  /**
   * Lấy danh sách thành viên của dự án (hỗ trợ lọc theo tên/email, vai trò)
   */
  async listMembers(
    projectId: number,
    currentUser: AuthenticatedUser,
    query?: ListProjectMembersQueryDto,
  ): Promise<ProjectMemberView[]> {
    await this.permission.ensureActiveMember(projectId, currentUser.id);

    const normalizedSearch = query?.search?.trim();

    return this.prisma.projectMember.findMany({
      where: {
        projectId,
        leftAt: null,
        ...(query?.role ? { role: query.role } : {}),
        ...(normalizedSearch
          ? {
              OR: [
                {
                  user: {
                    email: {
                      contains: normalizedSearch,
                      mode: 'insensitive',
                    },
                  },
                },
                {
                  user: {
                    name: {
                      contains: normalizedSearch,
                      mode: 'insensitive',
                    },
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: {
        joinedAt: 'asc',
      },
      select: projectMemberSelect,
    });
  }

  /**
   * Cập nhật vai trò (Role) của thành viên trong dự án
   */
  async updateMemberRole(
    projectId: number,
    memberId: number,
    currentUser: AuthenticatedUser,
    dto: UpdateProjectMemberRoleDto,
  ): Promise<ProjectMemberView> {
    await this.permission.ensureCanManageMembers(projectId, currentUser.id);
    const membership =
      await this.permission.ensureProjectHasMember(projectId, memberId);

    if (membership.leftAt) {
      throw new ConflictException('Member is no longer active in this project.');
    }

    if (membership.userId === currentUser.id) {
      throw new ConflictException(
        'Use a dedicated self-service flow to change your own project role.',
      );
    }

    if (membership.role === ProjectRole.OWNER || dto.role === ProjectRole.OWNER) {
      throw new ConflictException(
        'Ownership changes are not supported from the generic role update flow.',
      );
    }

    const updatedMembership = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.projectMember.update({
        where: { id: membership.id },
        data: {
          role: dto.role,
        },
        select: projectMemberSelect,
      });

      return updated;
    });

    this.eventEmitter.emit(
      MessageEventNames.PROJECT_MEMBER_ROLE_CHANGED,
      new ProjectMemberRoleChangedEvent(
        projectId,
        updatedMembership.user.id,
        membership.role,
        dto.role,
        currentUser.id,
        currentUser.email,
        updatedMembership.user.email,
      ),
    );

    return updatedMembership;
  }

  /**
   * Gỡ thành viên ra khỏi dự án (đánh dấu leftAt)
   */
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

    if (membership.userId === currentUser.id) {
      throw new ConflictException(
        'Use a dedicated leave-project flow instead of removing your own membership.',
      );
    }

    if (membership.role === ProjectRole.OWNER) {
      throw new ConflictException(
        'Project owners cannot be removed until ownership transfer is supported.',
      );
    }

    const removedMembership = await this.prisma.$transaction(async (tx) => {
      const removed = await tx.projectMember.update({
        where: { id: membership.id },
        data: {
          leftAt: new Date(),
        },
        select: projectMemberSelect,
      });

      return removed;
    });

    this.eventEmitter.emit(
      MessageEventNames.PROJECT_MEMBER_REMOVED,
      new ProjectMemberRemovedEvent(
        projectId,
        removedMembership.user.id,
        membership.role,
        currentUser.id,
        currentUser.email,
        removedMembership.user.email,
      ),
    );

    return removedMembership;
  }
}
