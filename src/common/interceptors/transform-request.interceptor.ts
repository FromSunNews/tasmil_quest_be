import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * Utility function to convert camelCase to snake_case
 */
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Recursively transform object keys from camelCase to snake_case
 */
function transformKeysToSnakeCase(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(transformKeysToSnakeCase);
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const transformed: Record<string, unknown> = {};
    const objRecord = obj as Record<string, unknown>;
    for (const key in objRecord) {
      if (Object.prototype.hasOwnProperty.call(objRecord, key)) {
        const snakeKey = camelToSnake(key);
        transformed[snakeKey] = transformKeysToSnakeCase(objRecord[key]);
      }
    }
    return transformed;
  }

  return obj;
}

/**
 * Interceptor to automatically transform camelCase request body and query params to snake_case
 * This allows frontend to send camelCase while backend expects snake_case
 */
@Injectable()
export class TransformRequestInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();

    // Transform request body
    if (request.body && typeof request.body === 'object') {
      request.body = transformKeysToSnakeCase(request.body);
    }

    // Transform query parameters
    if (request.query && typeof request.query === 'object') {
      request.query = transformKeysToSnakeCase(request.query);
    }

    return next.handle();
  }
}
