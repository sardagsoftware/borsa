import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

/**
 * White-Hat: Global exception handler
 * - Sanitizes error messages (no stack traces in production)
 * - Logs incidents for IRFS
 * - Returns safe error responses
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message || message;
      errorCode = (exceptionResponse as any).error || 'HTTP_EXCEPTION';
    } else if (exception instanceof Error) {
      message = exception.message;
      errorCode = exception.name;
    }

    // Log for IRFS (Incident Reporting)
    this.logger.error(
      `${request.method} ${request.url} - ${status} ${errorCode}: ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    // Sanitized response (no stack traces)
    response.status(status).json({
      success: false,
      error: {
        code: errorCode,
        message: process.env.NODE_ENV === 'production'
          ? this.sanitizeMessage(message)
          : message,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    });
  }

  /**
   * White-Hat: Sanitize error messages in production
   * Remove sensitive data, stack traces, internal paths
   */
  private sanitizeMessage(message: string): string {
    // Remove file paths
    message = message.replace(/\/[^\s]+\.(ts|js)/g, '[FILE_PATH]');
    // Remove potential secrets
    message = message.replace(/[a-zA-Z0-9]{32,}/g, '[REDACTED]');
    return message;
  }
}
