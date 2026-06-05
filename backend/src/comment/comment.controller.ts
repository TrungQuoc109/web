import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/auth.types';

@ApiTags('Comments')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task comment' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.commentService.create(user.id, createCommentDto);
  }

  @Get('task/:taskId')
  @ApiOperation({ summary: 'Get all comments for a task' })
  findAllByTask(
    @CurrentUser() user: AuthenticatedUser,
    @Param('taskId', ParseIntPipe) taskId: number,
  ) {
    return this.commentService.findAllByTask(user.id, taskId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a task comment' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    return this.commentService.update(user.id, id, updateCommentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task comment' })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.commentService.remove(user.id, id);
  }
}
