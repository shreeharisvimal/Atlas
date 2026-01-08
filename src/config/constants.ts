/**
 * Application-wide constants and configuration values
 * These values can be overridden via environment variables or config files
 */

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}

/**
 * Get environment variable with type safety
 */
function getEnvVar(key: keyof ImportMetaEnv, defaultValue: string): string {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key] as string;
  }
  return defaultValue;
}

/**
 * API Configuration
 */
export const API_CONFIG = {
  BASE_URL: getEnvVar('VITE_API_URL', 'http://localhost:8765'),
  DEFAULT_TIMEOUT: 30000, // 30 seconds
} as const;

/**
 * Pagination Configuration
 */
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 50,
  MIN_PAGE_SIZE: 1,
  MAX_PAGE_SIZE: 100,
  DASHBOARD_TICKET_LIMIT: 10,
} as const;

/**
 * Debounce Configuration
 */
export const DEBOUNCE_CONFIG = {
  SEARCH_DELAY: 500, // milliseconds
} as const;

/**
 * UI Configuration
 */
export const UI_CONFIG = {
  ANIMATION_DELAY_BASE: 30, // milliseconds per item for staggered animations
  TOAST_DURATION: 3000, // milliseconds
} as const;

/**
 * Validation Configuration
 */
export const VALIDATION_CONFIG = {
  MIN_TITLE_LENGTH: 3,
  MAX_TITLE_LENGTH: 200,
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
} as const;

/**
 * File Upload Configuration
 */
export const FILE_UPLOAD_CONFIG = {
  MAX_FILE_SIZE_MB: 200,
  MAX_PROFILE_PICTURE_SIZE_MB: 5,
} as const;

/**
 * Token Validation Configuration
 */
export const TOKEN_CONFIG = {
  JWT_PARTS_COUNT: 3,
} as const;


