class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isCustom = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotAuthenticatedError extends AppError {
  constructor(message = "Not authenticated") {
    super(message, 401);
  }
}

class NotAuthorizedError extends AppError {
  constructor(message = "Not authorized") {
    super(message, 403);
  }
}

class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404);
  }
}

class ResourceExistsError extends AppError {
  constructor(message = "Resource already exists") {
    super(message, 409);
  }
}

class ValidationError extends AppError {
  constructor(message = "Validation error") {
    super(message, 400);
  }
}

class MissingFieldsError extends AppError {
  constructor(message = "Missing fields") {
    super(message, 400);
  }
}

module.exports = {
  AppError,
  NotAuthenticatedError,
  NotAuthorizedError,
  NotFoundError,
  ResourceExistsError,
  ValidationError,
  MissingFieldsError,
};