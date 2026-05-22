import {
  BadRequestException,
  Controller,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { UploadedFileResponseDto } from './dto/uploaded-file-response.dto';
import { RateLimit } from '../shared/guards/rate-limit.guard';

const { diskStorage } = require('multer');

const taskReportUploadDirectory = join(
  process.cwd(),
  'uploads',
  'task-reports',
);
// Whitelist các đuôi mở rộng hợp lệ nhằm bảo vệ chống giả mạo mimetype
const allowedExtensions = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.gif',
  '.pdf',
  '.txt',
  '.zip',
]);

const allowedMimeTypes = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
  'application/zip',
  'application/x-zip-compressed',
]);

if (!existsSync(taskReportUploadDirectory)) {
  mkdirSync(taskReportUploadDirectory, { recursive: true });
}

@UseGuards(JwtAuthGuard)
@ApiBearerAuth('bearer')
@ApiTags('Tệp đính kèm')
@Controller('uploads')
export class UploadsController {
  @Post('task-report-attachments')
  @RateLimit({ windowMs: 60_000, max: 30, keyPrefix: 'uploads:task-report' })
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage: diskStorage({
        destination: taskReportUploadDirectory,
        filename: (
          _req: unknown,
          file: { originalname: string },
          callback: (error: Error | null, filename: string) => void,
        ) => {
          const safeBaseName = file.originalname
            .replace(/\.[^/.]+$/, '')
            .replace(/[^a-zA-Z0-9-_]+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 60);
          const extension = extname(file.originalname) || '';
          const timestamp = Date.now();
          callback(
            null,
            `${timestamp}-${safeBaseName || 'attachment'}${extension.toLowerCase()}`,
          );
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
      fileFilter: (
        _req: unknown,
        file: { originalname: string; mimetype: string },
        callback: (error: Error | null, acceptFile: boolean) => void,
      ) => {
        const ext = extname(file.originalname).toLowerCase();

        // 1. Xác thực Đuôi mở rộng (Extension) của tệp gốc
        if (!ext || !allowedExtensions.has(ext)) {
          callback(
            new BadRequestException(
              'Unsupported file extension. Only images, PDFs, text files, or zip archives are allowed.',
            ),
            false,
          );
          return;
        }

        // 2. Xác thực chéo Mimetype do client khai báo để gia cố bảo mật
        if (!allowedMimeTypes.has(file.mimetype)) {
          callback(
            new BadRequestException(
              'Unsupported file mimetype. The declared mimetype does not match allowed types.',
            ),
            false,
          );
          return;
        }

        callback(null, true);
      },
    }),
  )
  @ApiOperation({ summary: 'Tải file đính kèm cho báo cáo công việc' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Danh sách file đã tải lên thành công',
    type: UploadedFileResponseDto,
    isArray: true,
  })
  @ApiBadRequestResponse({ description: 'File không hợp lệ hoặc vượt quá giới hạn cho phép' })
  @ApiUnauthorizedResponse({ description: 'Thiếu token xác thực' })
  @ApiForbiddenResponse({ description: 'Không đủ quyền tải tệp' })
  uploadTaskReportAttachments(
    @UploadedFiles()
    files: Array<{
      originalname: string;
      filename: string;
      mimetype: string;
      size: number;
    }>,
  ): UploadedFileResponseDto[] {
    if (!files?.length) {
      throw new BadRequestException('Please select at least one attachment to upload.');
    }

    return files.map((file) => ({
      fileName: file.originalname,
      url: `/uploads/task-reports/${file.filename}`,
      mimeType: file.mimetype,
      size: file.size,
    }));
  }
}
