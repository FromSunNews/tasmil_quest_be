import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, unknown> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<{ success: boolean; data: T; error: null }> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        error: null,
      })),
    );
  }
}

