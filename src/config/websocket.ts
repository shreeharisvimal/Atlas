// WebSocket configuration
import { API_CONFIG } from './constants';

export const WEBSOCKET_CONFIG = {
  // Base WebSocket URL (will be converted from HTTP to WS)
  getBaseUrl: (): string => {
    const apiUrl = import.meta.env?.VITE_API_URL || API_CONFIG.BASE_URL;
    // Convert http:// to ws:// and https:// to wss://
    if (apiUrl.startsWith('https://')) {
      return apiUrl.replace('https://', 'wss://');
    }
    return apiUrl.replace('http://', 'ws://');
  },
  
  // Reconnection settings
  RECONNECT_DELAY: 3000,  // milliseconds
  MAX_RECONNECT_ATTEMPTS: 5,
  HEARTBEAT_INTERVAL: 30000,  // 30 seconds
  
  // Notification pop-up settings
  NOTIFICATION_DURATION: 5000,  // 5 seconds
  NOTIFICATION_MAX_VISIBLE: 3,  // Maximum notifications visible at once
};


