import { BadRequestException, HttpException } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { ArgumentsHost } from '@nestjs/common';
import { WsAllExceptionsFilter } from './ws-exception.filter';

describe('WsAllExceptionsFilter', () => {
  let filter: WsAllExceptionsFilter;
  let mockClient: { emit: jest.Mock };
  let mockArgumentsHost: any;

  beforeEach(() => {
    filter = new WsAllExceptionsFilter();
    mockClient = { emit: jest.fn() };
  });

  function createMockHost(args: any[]): ArgumentsHost {
    return {
      switchToWs: jest.fn().mockReturnValue({
        getClient: jest.fn().mockReturnValue(mockClient),
        getData: jest.fn(),
      }),
      getArgs: jest.fn().mockReturnValue(args),
      getType: jest.fn(),
      switchToHttp: jest.fn(),
      switchToRpc: jest.fn(),
      getArgByIndex: jest.fn(),
    } as unknown as ArgumentsHost;
  }

  it('handles standard Error and responds via ack callback', () => {
    const ackSpy = jest.fn();
    const args = ['somePayload', ackSpy];
    const host = createMockHost(args);
    const exception = new Error('Test standard database error');

    filter.catch(exception, host);

    expect(ackSpy).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'Test standard database error',
      },
    });
    expect(mockClient.emit).not.toHaveBeenCalled();
  });

  it('handles WsException and responds via ack callback', () => {
    const ackSpy = jest.fn();
    const args = ['somePayload', ackSpy];
    const host = createMockHost(args);
    const exception = new WsException('Forbidden WS operation');

    filter.catch(exception, host);

    expect(ackSpy).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'Forbidden WS operation',
      },
    });
    expect(mockClient.emit).not.toHaveBeenCalled();
  });

  it('handles HttpException with single string error and responds via ack callback', () => {
    const ackSpy = jest.fn();
    const args = ['somePayload', ackSpy];
    const host = createMockHost(args);
    const exception = new HttpException('HTTP exception message', 400);

    filter.catch(exception, host);

    expect(ackSpy).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'HTTP exception message',
      },
    });
  });

  it('handles BadRequestException (validation errors) with array message and returns first error in ack', () => {
    const ackSpy = jest.fn();
    const args = ['somePayload', ackSpy];
    const host = createMockHost(args);
    
    // Simulating standard NestJS ValidationPipe validation error response
    const exception = new BadRequestException({
      statusCode: 400,
      message: ['projectId must be an integer', 'title should not be empty'],
      error: 'Bad Request',
    });

    filter.catch(exception, host);

    expect(ackSpy).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'projectId must be an integer', // Should extract the first validation error cleanly
      },
    });
    expect(mockClient.emit).not.toHaveBeenCalled();
  });

  it('falls back to emitting socket:error when no ack callback is provided', () => {
    const args = ['payloadWithoutAck']; // No ack callback at the end
    const host = createMockHost(args);
    const exception = new WsException('Unauthorized access to room');

    filter.catch(exception, host);

    expect(mockClient.emit).toHaveBeenCalledWith('socket:error', {
      success: false,
      error: {
        message: 'Unauthorized access to room',
      },
    });
  });
});
