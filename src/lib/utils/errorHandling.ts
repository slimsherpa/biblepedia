/**
 * Utility functions for error handling
 */

/**
 * Safely converts any error to a string message
 * This ensures we never try to render an error object directly
 */
export function getErrorMessage(error: unknown): string {
  if (error === null || error === undefined) {
    return 'An unknown error occurred';
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  // For objects with name, code, level properties (like the one in the error message)
  if (typeof error === 'object') {
    try {
      const errorObj = error as any;
      
      // Check for the specific error pattern we're seeing
      if (errorObj.name && errorObj.code && errorObj.level) {
        return `Error ${errorObj.code}: ${errorObj.name}`;
      }
      
      // Try to extract a message property if it exists
      if (errorObj.message && typeof errorObj.message === 'string') {
        return errorObj.message;
      }
      
      return JSON.stringify(error);
    } catch {
      return 'An error object occurred that could not be stringified';
    }
  }
  
  return String(error);
} 