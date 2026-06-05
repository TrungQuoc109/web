import { Catch, ArgumentsHost, WsExceptionFilter, HttpException } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

@Catch()
export class WsAllExceptionsFilter implements WsExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient();
    const args = host.getArgs();

    // Look for the ack callback which is usually the last parameter in Socket.io event signature
    const ack = typeof args[args.length - 1] === 'function' ? args[args.length - 1] : null;

    let message: string | string[] = 'Unexpected socket exception.';

    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'object' && response !== null) {
        const resObj = response as { message?: string | string[] };
        message = resObj.message || exception.message;
      } else {
        message = String(response);
      }
    } else if (exception instanceof WsException) {
      message = exception.message;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Safely extract the first validation message if it's an array of validation errors
    const errorMessage = Array.isArray(message)
      ? message[0]
      : typeof message === 'string'
      ? message
      : 'Unexpected socket exception.';

    const errorResponse = {
      success: false as const,
      error: {
        message: errorMessage,
      },
    };

    if (ack) {
      // Respond back to client using their ack callback function
      ack(errorResponse);
    } else {
      // Fallback: emit a dedicated 'socket:error' event directly to this client socket
      client.emit('socket:error', errorResponse);
    }
  }
}
