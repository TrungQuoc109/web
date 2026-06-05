import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaskPermissionService } from '../task/task-permission.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly taskPermissionService: TaskPermissionService,
  ) {}

  async create(userId: number, dto: CreateCommentDto) {
    await this.taskPermissionService.ensureCanViewTask(dto.taskId, userId);

    return this.prisma.comment.create({
      data: {
        content: dto.content,
        attachments: dto.attachments ?? [],
        taskId: dto.taskId,
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });
  }

  async findAllByTask(userId: number, taskId: number) {
    await this.taskPermissionService.ensureCanViewTask(taskId, userId);

    return this.prisma.comment.findMany({
      where: { taskId },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async update(userId: number, id: number, dto: UpdateCommentDto) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found.');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own comments.');
    }

    return this.prisma.comment.update({
      where: { id },
      data: {
        content: dto.content,
        attachments: dto.attachments,
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });
  }

  async remove(userId: number, id: number) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found.');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own comments.');
    }

    await this.prisma.comment.delete({
      where: { id },
    });

    return { success: true };
  }
}
