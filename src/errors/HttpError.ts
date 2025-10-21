export class HttpError extends Error {
  statusCode: number;
  code?: string;
  details?: any;

  constructor(message: string, statusCode = 500, code?: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }
}

export class BadRequestError extends HttpError {
  constructor(message = "Bad Request", details?: any) {
    super(message, 400, "bad_request", details);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = "Unauthorized", details?: any) {
    super(message, 401, "unauthorized", details);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = "Forbidden", details?: any) {
    super(message, 403, "forbidden", details);
  }
}

export class NotFoundError extends HttpError {
  constructor(message = "Not Found", details?: any) {
    super(message, 404, "not_found", details);
  }
}

export class InternalError extends HttpError {
  constructor(message = "Internal Server Error", details?: any) {
    super(message, 500, "internal_error", details);
  }
}
