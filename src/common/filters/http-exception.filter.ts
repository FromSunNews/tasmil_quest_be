import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : {
            success: false,
            data: null,
            error: {
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Internal server error',
            },
          };

    if (!(exception instanceof HttpException)) {
      this.logger.error(
        `Unhandled exception for ${request.method} ${request.url}`,
        exception as Error,
      );
    }

    response.status(status).json({
      success: false,
      data: null,
      error:
        typeof errorResponse === 'object'
          ? (errorResponse as Record<string, unknown>).error ??
            errorResponse ??
            {
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Internal server error',
            }
          : {
              code: 'INTERNAL_SERVER_ERROR',
              message: String(errorResponse),
            },
    });
  }
}

