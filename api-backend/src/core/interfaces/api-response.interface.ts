/**
 * Represents the structure of a successful API response.
 * Supports two shapes: one with data (and an optional message),
 * and one with just a message.
 */
export type ApiResponse<T = any> =
  | {
      status: 'success';
      statusCode: number;
      data: T;
      message?: string;
    }
  | {
      status: 'success';
      statusCode: number;
      message: string;
    };
