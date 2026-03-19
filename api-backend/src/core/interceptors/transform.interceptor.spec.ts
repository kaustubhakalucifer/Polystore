import { ExecutionContext, CallHandler } from '@nestjs/common';
import { TransformInterceptor } from './transform.interceptor';
import { of } from 'rxjs';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<any>;

  beforeEach(() => {
    interceptor = new TransformInterceptor();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should return the "Message Only" shape when the response is a string', (done) => {
    const mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue({
          statusCode: 200,
        }),
      }),
    } as unknown as ExecutionContext;

    const mockCallHandler = {
      handle: jest.fn().mockReturnValue(of('User created successfully')),
    } as unknown as CallHandler;

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result).toEqual({
          status: 'success',
          statusCode: 200,
          message: 'User created successfully',
        });
        done();
      },
    });
  });

  it('should return the "With Data" shape when the response is an object', (done) => {
    const mockData = { id: 1, name: 'John Doe' };
    const mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue({
          statusCode: 201,
        }),
      }),
    } as unknown as ExecutionContext;

    const mockCallHandler = {
      handle: jest.fn().mockReturnValue(of(mockData)),
    } as unknown as CallHandler;

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result).toEqual({
          status: 'success',
          statusCode: 201,
          data: mockData,
        });
        done();
      },
    });
  });

  it('should return the "With Data" shape when the response is an array', (done) => {
    const mockData = [{ id: 1 }, { id: 2 }];
    const mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue({
          statusCode: 200,
        }),
      }),
    } as unknown as ExecutionContext;

    const mockCallHandler = {
      handle: jest.fn().mockReturnValue(of(mockData)),
    } as unknown as CallHandler;

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result).toEqual({
          status: 'success',
          statusCode: 200,
          data: mockData,
        });
        done();
      },
    });
  });
});
