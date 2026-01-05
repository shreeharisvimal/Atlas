/**
 * Utility function to extract error messages from FastAPI error responses
 * Handles both string errors and validation error arrays
 */
export function extractErrorMessage(error: any, defaultMessage: string = 'An error occurred'): string {
  if (!error) {
    return defaultMessage;
  }

  // Check for FastAPI validation errors (422)
  if (error.response?.data?.detail) {
    const detail = error.response.data.detail;
    
    // FastAPI validation errors are arrays of error objects
    if (Array.isArray(detail)) {
      return detail
        .map((err: any) => {
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

  // Check for error message
  if (error.message) {
    return error.message;
  }

  // Check for response message
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  return defaultMessage;
}

