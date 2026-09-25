import { ValidationSeverity } from '../types';

export interface ErrorOptions {
  code: string;
  message: string;
  severity?: ValidationSeverity;
  metadata?: Record<string, unknown>;
  cause?: unknown;
}

export class ImporterError extends Error {
  public readonly code: string;
  public readonly severity: ValidationSeverity;
  public readonly metadata?: Record<string, unknown>;

  constructor(options: ErrorOptions) {
    super(options.message);
    this.name = 'ImporterError';
    this.code = options.code;
    this.severity = options.severity || 'error';
    this.metadata = options.metadata;
    if (options.cause) {
      this.cause = options.cause;
    }
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class FileError extends ImporterError {
  constructor(options: ErrorOptions) {
    super(options);
    this.name = 'FileError';
  }
}

export class ParserError extends ImporterError {
  constructor(options: ErrorOptions) {
    super(options);
    this.name = 'ParserError';
  }
}

export class MappingError extends ImporterError {
  constructor(options: ErrorOptions) {
    super(options);
    this.name = 'MappingError';
  }
}

export class TransformationError extends ImporterError {
  constructor(options: ErrorOptions) {
    super(options);
    this.name = 'TransformationError';
  }
}

export class ValidationEngineError extends ImporterError {
  constructor(options: ErrorOptions) {
    super(options);
    this.name = 'ValidationEngineError';
  }
}

export class ImportError extends ImporterError {
  constructor(options: ErrorOptions) {
    super(options);
    this.name = 'ImportError';
  }
}
