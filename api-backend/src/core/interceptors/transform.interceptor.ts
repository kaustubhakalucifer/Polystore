import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/api-response.interface';

/**
 * Global response interceptor to transform successful API responses into
 * a strict, generic, and typed JSON structure.
 *
 * Implements the NestInterceptor interface.
 * Ensures consistent response bodies across all controller endpoints.
 * @template T - The type of the data returned by the controller
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  /**
   * Intercepts the response from the controller and formats it according to `ApiResponse`.
   *
   * @param context - The execution context of the request
   * @param next - The call handler to proceed to the route handler
   * @returns An observable of the formatted response
   */
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((res: unknown) => {
        const ctx = context.switchToHttp();
        const response = ctx.getResponse<{ statusCode: number }>();
        const statusCode = response.statusCode || 200;

        // If the controller returns a string, map it to the "Message Only" shape
        if (typeof res === 'string') {
          return {
            status: 'success',
            statusCode,
            message: res,
          };
        }

        // If the controller returns an object/array, map it to the "With Data" shape
        return {
          status: 'success',
          statusCode,
          data: res as T,
        };
      }),
    );
  }
}
