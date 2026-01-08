/**
 * Utility function to extract error messages from FastAPI error responses
 * Handles both string errors and validation error arrays
 */
import type { APIError, ValidationErrorDetail } from '../types/errors';

export function extractErrorMessage(error: unknown, defaultMessage: string = 'An error occurred'): string {
  if (!error) {
    return defaultMessage;
  }

  // Check for FastAPI validation errors (422)
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const apiError = error as APIError;
    
    // First, try to get the detail from API response
    if (apiError.response?.data?.detail) {
      const detail = apiError.response.data.detail;
      
      // FastAPI validation errors are arrays of error objects
      if (Array.isArray(detail)) {
        return detail
          .map((err: ValidationErrorDetail) => {
            const field = err.loc?.[err.loc.length - 1] || 'field';
            return `${field}: ${err.msg || 'Invalid value'}`;
          })
          .join(', ') || 'Validation error';
      }
      
      // Single string error
      if (typeof detail === 'string') {
        return detail;
      }
      
      // Fallback for other detail types
      return 'Validation error';
    }

    // Check for response message
    if (apiError.response?.data?.message) {
      return apiError.response.data.message;
    }

    // Handle HTTP status codes with meaningful messages
    const status = apiError.response?.status;
    const url = apiError.config?.url || '';
    
    if (status === 404) {
      // Extract resource name from URL for better error message
      const resourceMatch = url.match(/\/api\/v1\/([^\/\?]+)/);
      const resource = resourceMatch ? resourceMatch[1].replace(/-/g, ' ') : 'resource';
      return `${resource.charAt(0).toUpperCase() + resource.slice(1)} not found`;
    }
    
    if (status === 403) {
      return 'You do not have permission to perform this action';
    }
    
    if (status === 401) {
      return 'Authentication required. Please log in again.';
    }
    
    if (status === 500) {
      return 'Server error. Please try again later.';
    }
    
    if (status === 429) {
      return 'Too many requests. Please wait a moment and try again.';
    }
  }

  // Check for error message (but filter out generic axios messages)
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const errorWithMessage = error as { message: string };
    if (typeof errorWithMessage.message === 'string') {
      const msg = errorWithMessage.message;
      // Don't return generic axios status code messages
      if (!msg.includes('Request failed with status code')) {
        return msg;
      }
    }
  }

  return defaultMessage;
}


