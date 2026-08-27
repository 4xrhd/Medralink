class AppError extends Error {
  constructor(message, status = 500, code = 'processing') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

class BadRequestError extends AppError {
  constructor(message = 'Bad Request', code = 'required') {
    super(message, 400, code);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', code = 'forbidden') {
    super(message, 403, code);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource Not Found', code = 'not-found') {
    super(message, 404, code);
  }
}

module.exports = {
  AppError,
  BadRequestError,
  ForbiddenError,
  NotFoundError,
};
