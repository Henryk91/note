/* eslint-disable max-classes-per-file */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const msg = identifier ? `${resource} with identifier '${identifier}' not found` : `${resource} not found`;
    super(404, msg);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access') {
    super(401, message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, originalError?: Error) {
    super(503, `External service '${service}' is unavailable`);
    if (originalError) {
      this.stack = originalError.stack;
    }
  }
}
