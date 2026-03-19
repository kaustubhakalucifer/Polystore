import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * Global exception filter to transform error responses into
 * a strict, generic, and typed JSON structure consistent with `ApiResponse`.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

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

    const finalMessage = Array.isArray(message) ? message.join(', ') : message;

    if (status === 500) {
      this.logger.error(
        `HTTP Error: ${status} - ${finalMessage}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(`HTTP Warning: ${status} - ${finalMessage}`);
    }

    response.status(status).json({
      status: 'error',
      statusCode: status,
      message: finalMessage,
    });
  }
}
