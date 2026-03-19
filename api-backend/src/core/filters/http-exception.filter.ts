import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * Global exception filter to transform error responses into
 * a strict, generic, and typed JSON structure consistent with `ApiResponse`.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  /**
   * Catches exceptions and formats the HTTP response
   * @param exception - The thrown exception
   * @param host - The arguments host containing the execution context
   */
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as { message?: string | string[] }).message ||
          'Internal server error';

    const finalMessage = Array.isArray(message) ? message[0] : message;

    response.status(status).json({
      status: 'error',
      statusCode: status,
      message: finalMessage,
    });
  }
}
