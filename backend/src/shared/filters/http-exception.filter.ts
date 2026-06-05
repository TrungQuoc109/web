import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resContent = exception.getResponse();
      if (typeof resContent === 'object' && resContent !== null && 'message' in resContent) {
        message = (resContent as any).message;
      } else {
        message = exception.message;
      }
    } else if (
      exception &&
      typeof exception === 'object' &&
      'code' in exception &&
      typeof (exception as any).code === 'string'
    ) {
      // Prisma Client Error handling
      const prismaError = exception as { code: string; message?: string };
      switch (prismaError.code) {
        case 'P2002': // Unique constraint violation
          status = HttpStatus.CONFLICT;
          message = 'A record with this value already exists.';
          break;
        case 'P2025': // Record not found
          status = HttpStatus.NOT_FOUND;
          message = 'The requested record could not be found.';
          break;
        case 'P2003': // Foreign key constraint violation
          status = HttpStatus.BAD_REQUEST;
          message = 'Foreign key constraint failed. Related record does not exist.';
          break;
        default:
          this.logger.error(`Database error: ${prismaError.code} - ${prismaError.message}`);
          message = 'Database operation failed.';
          break;
      }
    } else {
      this.logger.error('Unhandled exception encountered:', exception);
    }

    // Format final standardized error structure
    const errorResponse = {
      success: false as const,
      error: {
        statusCode: status,
        message: Array.isArray(message) ? message[0] : message,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    };

    response.status(status).json(errorResponse);
  }
}
