export class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Very important to handle the error, its basically a flag.
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = "Bad Request") {
    return new ApiError(400, message);
  }
  static unauthirized(message = "Bad Request") {
    return new ApiError(401, message);
  }
  static conflict(message = "Conflict - User already exits") {
    return new ApiError(409, message);
  }
  static forbidden(message = "forbidden") {
    return new ApiError(403, message);
  }
  static notFound(message = "notFound") {
    return new ApiError(404, message);
  }
}
