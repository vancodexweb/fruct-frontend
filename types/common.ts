/** Shared primitives used across every domain module. */

/** Every Decimal field in the backend's DTOs is serialized as a numeric string. */
export type DecimalString = string;

export interface ListQuery {
  limit?: number;
  offset?: number;
}

/** Shape of a NestJS `ValidationPipe` / `HttpException` error body. */
export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  error?: string;
}
