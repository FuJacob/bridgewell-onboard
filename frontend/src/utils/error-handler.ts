// Enhanced error handling utilities

import type { DatabaseError, SharePointError } from "@/types";

export class ApplicationError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    statusCode: number = 500,
    details?: unknown
  ) {
    super(message);
    this.name = 'ApplicationError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class ValidationError extends ApplicationError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class DatabaseOperationError extends ApplicationError {
  constructor(dbError: DatabaseError) {
    super(
      dbError.message, 
      dbError.code || 'DATABASE_ERROR', 
      500, 
      { hint: dbError.hint, details: dbError.details }
    );
    this.name = 'DatabaseOperationError';
  }
}

export class SharePointOperationError extends ApplicationError {
  constructor(spError: SharePointError) {
    super(
      spError.message,
      spError.errorCode || 'SHAREPOINT_ERROR',
      spError.statusCode || 500,
      spError.details
    );
    this.name = 'SharePointOperationError';
  }
}

// Error logging utility
export function logError(error: Error, context?: string): void {
  const timestamp = new Date().toISOString();
  const logMessage = {
    timestamp,
    context: context || 'unknown',
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(error instanceof ApplicationError && {
        code: error.code,
        statusCode: error.statusCode,
        details: error.details
      })
    }
  };

  // In development, log to console with full details
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${timestamp}] ${context || 'Error'}:`, error);
    console.error('Full error details:', logMessage);
  } else {
    // In production, you might want to send to monitoring service
    console.error(JSON.stringify(logMessage));
  }
}

// User-friendly error messages
export function getUserFriendlyErrorMessage(error: Error): string {
  if (error instanceof ValidationError) {
    return error.message; // Validation errors are already user-friendly
  }

  if (error instanceof DatabaseOperationError) {
    return 'There was a problem saving your data. Please try again in a few moments.';
  }

  if (error instanceof SharePointOperationError) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      return 'Access denied. Please contact support for assistance.';
    }
    if (error.statusCode === 404) {
      return 'The requested file or folder could not be found.';
    }
    if (error.statusCode === 429) {
      return 'Too many requests. Please wait a moment and try again.';
    }
    return 'There was a problem with file operations. Please try again.';
  }

  // Generic fallback for unknown errors
  return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
}

// Helper to safely parse error responses
export async function safeParseErrorResponse(response: Response): Promise<{ error: string; success: false }> {
  try {
    const data = await response.json();
    return {
      error: data.error || `HTTP ${response.status}: ${response.statusText}`,
      success: false
    };
  } catch {
    return {
      error: `HTTP ${response.status}: ${response.statusText}`,
      success: false
    };
  }
}