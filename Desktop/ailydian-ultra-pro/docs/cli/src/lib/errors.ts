/**
 * Error Handling
 * Custom error classes and error handling utilities
 */

import { ExitCode } from '../types';

export class CLIError extends Error {
  constructor(
    message: string,
    public exitCode: ExitCode = ExitCode.ERROR,
    public details?: any
  ) {
    super(message);
    this.name = 'CLIError';
  }
}

export class AuthenticationError extends CLIError {
  constructor(message: string = 'Authentication failed', details?: any) {
    super(message, ExitCode.AUTH_ERROR, details);
    this.name = 'AuthenticationError';
  }
}

export class ConfigurationError extends CLIError {
  constructor(message: string = 'Configuration error', details?: any) {
    super(message, ExitCode.CONFIG_ERROR, details);
    this.name = 'ConfigurationError';
  }
}

export class NetworkError extends CLIError {
  constructor(message: string = 'Network error', details?: any) {
    super(message, ExitCode.NETWORK_ERROR, details);
    this.name = 'NetworkError';
  }
}

export class NotFoundError extends CLIError {
  constructor(message: string = 'Resource not found', details?: any) {
    super(message, ExitCode.NOT_FOUND, details);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends CLIError {
  constructor(message: string = 'Validation error', details?: any) {
    super(message, ExitCode.USAGE_ERROR, details);
    this.name = 'ValidationError';
  }
}

/**
 * Handle CLI errors and exit with appropriate code
 */
export function handleError(error: any, verbose: boolean = false): never {
  if (error instanceof CLIError) {
    console.error(`Error: ${error.message}`);
    if (verbose && error.details) {
      console.error('Details:', JSON.stringify(error.details, null, 2));
    }
    process.exit(error.exitCode);
  } else if (error.code) {
    // API error
    console.error(`API Error [${error.code}]: ${error.message}`);
    if (verbose && error.details) {
      console.error('Details:', JSON.stringify(error.details, null, 2));
    }
    if (error.request_id) {
      console.error(`Request ID: ${error.request_id}`);
    }

    // Map API error codes to exit codes
    if (error.code.includes('AUTH') || error.code.includes('UNAUTHORIZED')) {
      process.exit(ExitCode.AUTH_ERROR);
    } else if (error.code.includes('NOT_FOUND')) {
      process.exit(ExitCode.NOT_FOUND);
    } else if (error.code.includes('NETWORK')) {
      process.exit(ExitCode.NETWORK_ERROR);
    }
    process.exit(ExitCode.ERROR);
  } else {
    console.error(`Error: ${error.message || error}`);
    if (verbose && error.stack) {
      console.error(error.stack);
    }
    process.exit(ExitCode.ERROR);
  }
}

/**
 * Validate required options
 */
export function validateRequired(value: any, name: string): void {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError(`${name} is required`);
  }
}

/**
 * Validate enum value
 */
export function validateEnum(value: string, allowed: string[], name: string): void {
  if (!allowed.includes(value)) {
    throw new ValidationError(
      `${name} must be one of: ${allowed.join(', ')}`,
      { value, allowed }
    );
  }
}

/**
 * Validate number range
 */
export function validateRange(value: number, min: number, max: number, name: string): void {
  if (value < min || value > max) {
    throw new ValidationError(
      `${name} must be between ${min} and ${max}`,
      { value, min, max }
    );
  }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format', { email });
  }
}

/**
 * Validate URL format
 */
export function validateUrl(url: string): void {
  try {
    new URL(url);
  } catch {
    throw new ValidationError('Invalid URL format', { url });
  }
}
