export class AppError extends Error {
  readonly code: string;
  readonly status?: number;

  constructor(code: string, message?: string, status?: number) {
    super(message || code);
    this.code = code;
    this.status = status;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}


