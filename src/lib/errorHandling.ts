/**
 * Security-focused error handling utility
 * Maps technical database errors to user-friendly messages to prevent information leakage
 */

// PostgreSQL error codes: https://www.postgresql.org/docs/current/errcodes-appendix.html
const POSTGRES_ERROR_MAP: Record<string, string> = {
  // Integrity constraint violations
  '23505': 'This item already exists.',
  '23503': 'Cannot complete this action: the item is in use.',
  '23502': 'Required information is missing.',
  '23514': 'The provided value is not valid.',
  
  // Permission/Authorization
  '42501': 'You do not have permission to perform this action.',
  '42000': 'You do not have permission to perform this action.',
  
  // Resource issues
  '53100': 'Service is temporarily unavailable. Please try again.',
  '53200': 'Service is temporarily unavailable. Please try again.',
  '53300': 'Too many requests. Please wait and try again.',
  
  // Query issues (don't reveal specifics)
  '42P01': 'An error occurred. Please try again.',
  '42703': 'An error occurred. Please try again.',
};

// PostgREST error codes
const POSTGREST_ERROR_MAP: Record<string, string> = {
  'PGRST116': 'Item not found.',
  'PGRST204': 'Item not found.',
  'PGRST301': 'You do not have permission to perform this action.',
  'PGRST302': 'You do not have permission to perform this action.',
};

// Supabase-specific error patterns
const SUPABASE_ERROR_PATTERNS: Array<{ pattern: RegExp; message: string }> = [
  { pattern: /row-level security/i, message: 'You do not have permission to perform this action.' },
  { pattern: /violates.*policy/i, message: 'You do not have permission to perform this action.' },
  { pattern: /duplicate key/i, message: 'This item already exists.' },
  { pattern: /foreign key/i, message: 'Cannot complete this action: related items exist.' },
  { pattern: /not found/i, message: 'Item not found.' },
  { pattern: /unauthorized/i, message: 'Please sign in to continue.' },
  { pattern: /jwt/i, message: 'Your session has expired. Please sign in again.' },
  { pattern: /token/i, message: 'Your session has expired. Please sign in again.' },
  { pattern: /rate limit/i, message: 'Too many requests. Please wait and try again.' },
  { pattern: /entitlement|limit exceeded|plan limit/i, message: 'This action exceeds your plan limits. Please upgrade to continue.' },
];

// Generic fallback message
const DEFAULT_ERROR_MESSAGE = 'An error occurred. Please try again or contact support.';

/**
 * Interface for error objects we handle
 */
interface ErrorLike {
  code?: string;
  error_code?: string;
  message?: string;
  details?: string;
  hint?: string;
}

/**
 * Converts technical database/API errors to safe, user-friendly messages.
 * Prevents information leakage by not exposing internal error details.
 * 
 * @param error - The error object from Supabase/PostgreSQL
 * @returns A safe, user-friendly error message
 */
export function getSafeErrorMessage(error: unknown): string {
  if (!error) {
    return DEFAULT_ERROR_MESSAGE;
  }

  // Handle string errors
  if (typeof error === 'string') {
    return matchPatternError(error) || DEFAULT_ERROR_MESSAGE;
  }

  const err = error as ErrorLike;
  
  // Check PostgreSQL error codes
  const pgCode = err.code || err.error_code;
  if (pgCode && POSTGRES_ERROR_MAP[pgCode]) {
    return POSTGRES_ERROR_MAP[pgCode];
  }

  // Check PostgREST error codes
  if (pgCode && POSTGREST_ERROR_MAP[pgCode]) {
    return POSTGREST_ERROR_MAP[pgCode];
  }

  // Check error message against known patterns
  const message = err.message || err.details || '';
  const patternMatch = matchPatternError(message);
  if (patternMatch) {
    return patternMatch;
  }

  // Return generic message for unknown errors
  return DEFAULT_ERROR_MESSAGE;
}

/**
 * Matches an error message against known patterns
 */
function matchPatternError(message: string): string | null {
  for (const { pattern, message: safeMessage } of SUPABASE_ERROR_PATTERNS) {
    if (pattern.test(message)) {
      return safeMessage;
    }
  }
  return null;
}

/**
 * Logs error details in development mode only.
 * In production, errors are only logged server-side.
 * 
 * @param context - Description of where the error occurred
 * @param error - The error object
 */
export function logError(context: string, error: unknown): void {
  if (import.meta.env.DEV) {
    console.error(`[${context}]`, error);
  }
  // In production, errors should be sent to a logging service
  // but not exposed in the browser console
}

/**
 * Wraps an async operation with safe error handling
 * Returns a tuple of [result, error] similar to Go-style error handling
 */
export async function safeAsync<T>(
  operation: () => Promise<T>
): Promise<[T | null, string | null]> {
  try {
    const result = await operation();
    return [result, null];
  } catch (error) {
    logError('safeAsync', error);
    return [null, getSafeErrorMessage(error)];
  }
}
