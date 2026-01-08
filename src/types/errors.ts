/**
 * Type-safe error handling types
 */

import { AxiosError } from 'axios';

/**
 * FastAPI validation error detail structure
 */
export interface ValidationErrorDetail {
  loc: (string | number)[];
  msg: string;
  type: string;
}

/**
 * FastAPI error response structure
 */
export interface FastAPIErrorResponse {
  detail: string | ValidationErrorDetail[];
  message?: string;
}

/**
 * Extended Axios error with FastAPI error structure
 */
export type APIError = AxiosError<FastAPIErrorResponse>;

/**
 * Type guard to check if error is an API error
 */
export function isAPIError(error: unknown): error is APIError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as AxiosError).response?.data === 'object'
  );
}

/**
 * Type guard to check if error has a detail field
 */
export function hasErrorDetail(error: unknown): error is { detail: string | ValidationErrorDetail[] } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'detail' in error &&
    (typeof (error as { detail: unknown }).detail === 'string' ||
      Array.isArray((error as { detail: unknown }).detail))
  );
}


