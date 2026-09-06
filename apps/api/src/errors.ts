export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    requestId: string;
  };
}

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    if (!Number.isInteger(statusCode) || statusCode < 400 || statusCode > 499) {
      throw new TypeError('AppError statusCode must be an integer between 400 and 499');
    }

    super(message);
    this.name = 'AppError';
  }
}

export class UpstreamServiceError extends Error {
  readonly statusCode = 502;

  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'UpstreamServiceError';
  }
}

export function createErrorResponse(
  requestId: string,
  code: string,
  message: string,
): ErrorResponse {
  return {
    error: {
      code,
      message,
      requestId,
    },
  };
}
