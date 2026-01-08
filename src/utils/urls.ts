/**
 * URL utility functions for production-ready asset and API URL handling
 */

import { API_CONFIG } from '../config/constants';

/**
 * Get the API base URL from environment variables
 */
export const getApiBaseUrl = (): string => {
  return API_CONFIG.BASE_URL;
};

/**
 * Get the backend URL (for serving static files like profile pictures)
 */
export const getBackendUrl = (): string => {
  // Use VITE_API_URL if available, otherwise fallback
  return getApiBaseUrl();
};

/**
 * Get absolute URL for a profile picture
 */
export const getProfilePictureUrl = (profilePictureUrl: string | null | undefined): string | null => {
  if (!profilePictureUrl) return null;
  
  // If already absolute URL, return as is
  if (profilePictureUrl.startsWith('http://') || profilePictureUrl.startsWith('https://')) {
    return profilePictureUrl;
  }
  
  // Convert relative URL to absolute
  const backendUrl = getBackendUrl().replace(/\/$/, ''); // Remove trailing slash
  const path = profilePictureUrl.startsWith('/') ? profilePictureUrl : `/${profilePictureUrl}`;
  return `${backendUrl}${path}`;
};

/**
 * Get absolute URL for an attachment download
 */
export const getAttachmentDownloadUrl = (attachmentId: number): string => {
  const apiUrl = getApiBaseUrl().replace(/\/$/, '');
  return `${apiUrl}/api/v1/tickets/attachments/${attachmentId}/download`;
};

/**
 * Get absolute URL for static assets (logos, etc.)
 * In production, these should be served from the same domain or CDN
 */
export const getStaticAssetUrl = (path: string): string => {
  // If already absolute, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // In production, static assets are served from the same origin
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // In development, assets are served from public folder
  // In production build, Vite handles this automatically
  return cleanPath;
};

