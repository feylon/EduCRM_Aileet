import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { EntityNotFoundError, QueryFailedError } from 'typeorm';

export interface ErrorResponse {
  success: false;
  statusCode: number;
  code: string;
  message: string;
  errors?: { field: string; messages: string[] }[];
  path: string;
  timestamp: string;
}

const DEFAULT_CODES: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'UNPROCESSABLE_ENTITY',
  429: 'TOO_MANY_REQUESTS',
  500: 'INTERNAL_ERROR',
};

/**
 * Converts every error into one predictable JSON shape. `code` is a stable,
 * machine-readable identifier the frontend uses for translated messages.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code: string | undefined;
    let errors: ErrorResponse['errors'];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else {
        const data = body as Record<string, any>;
        message = Array.isArray(data.message) ? data.message.join(', ') : data.message || message;
        code = data.code;
        errors = data.errors;
      }
    } else if (exception instanceof EntityNotFoundError) {
      status = HttpStatus.NOT_FOUND;
      message = 'Resource not found';
    } else if (exception instanceof QueryFailedError) {
      const driverError = (exception as QueryFailedError & { driverError: { code?: string; detail?: string } }).driverError;
      if (driverError?.code === '23505') {
        status = HttpStatus.CONFLICT;
        code = 'DUPLICATE_ENTRY';
        message = 'Record with the same unique value already exists';
      } else if (driverError?.code === '23503') {
        status = HttpStatus.CONFLICT;
        code = 'RELATION_CONSTRAINT';
        message = 'Operation violates a relation constraint';
      } else if (driverError?.code === '22P02') {
        status = HttpStatus.BAD_REQUEST;
        message = 'Invalid input syntax';
      } else {
        this.logger.error(exception.message, exception.stack);
      }
    } else {
      const error = exception as Error;
      this.logger.error(error?.message, error?.stack);
    }

    const payload: ErrorResponse = {
      success: false,
      statusCode: status,
      code: code || DEFAULT_CODES[status] || 'ERROR',
      message,
      ...(errors ? { errors } : {}),
      path: request.url,
      timestamp: new Date().toISOString(),
    };
    response.status(status).json(payload);
  }
}
