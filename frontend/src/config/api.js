// API Konfiguration für Multi-Tenant App
const API_CONFIG = {
  // 🚀 PRODUCTION URL (Railway) - DYNAMISCH per Environment
  BASE_URL: process.env.REACT_APP_API_URL || 'https://jkb-grounds-production.up.railway.app', 
  
  // Für lokale Entwicklung:
  // BASE_URL: 'http://127.0.0.1:8000',
  
  // Für lokales Netzwerk (gleiche WiFi):
  // BASE_URL: 'http://192.168.1.XXX:8000', // ← Deine lokale IP
  
  // TIMEOUT SETTINGS
  TIMEOUT: 10000, // 10 Sekunden
  
  // RETRY SETTINGS
  MAX_RETRIES: 3,
};

// API URLs
export const API_URLS = {
  // Auth
  AUTH_BASE: `${API_CONFIG.BASE_URL}/api/auth`,
  AUTH_USER: (userId) => `${API_CONFIG.BASE_URL}/api/auth/auth/user/${userId}`,
  
  // Courts
  COURTS_BY_VEREIN: (vereinId) => `${API_CONFIG.BASE_URL}/api/courts/verein/${vereinId}`,
  COURTS_CREATE: `${API_CONFIG.BASE_URL}/api/courts`,
  COURTS_UPDATE: (platzId) => `${API_CONFIG.BASE_URL}/api/courts/${platzId}`,
  COURTS_DELETE: (platzId) => `${API_CONFIG.BASE_URL}/api/courts/${platzId}`,
  
  // Bookings
  BOOKINGS_CREATE: `${API_CONFIG.BASE_URL}/api/bookings/create`,
  BOOKINGS_BY_DATE: (dateString, vereinId) => `${API_CONFIG.BASE_URL}/api/bookings/date/${dateString}?verein_id=${vereinId}`,
  BOOKINGS_DELETE: (bookingId) => `${API_CONFIG.BASE_URL}/api/bookings/${bookingId}`,
  
  // Users
  USER_PROFILE: (userId) => `${API_CONFIG.BASE_URL}/api/users/${userId}`,
  USER_BOOKINGS: (userId, fromDate) => `${API_CONFIG.BASE_URL}/api/users/${userId}/bookings?from_date=${fromDate}`,
  USER_ROLE: (userId) => `${API_CONFIG.BASE_URL}/api/users/${userId}/role`,
  
  // Roles & Permissions
  ROLES: `${API_CONFIG.BASE_URL}/api/roles`,
  PERMISSIONS_BY_VEREIN: (vereinId) => `${API_CONFIG.BASE_URL}/api/permissions/verein/${vereinId}`,
  PERMISSIONS_TOGGLE: `${API_CONFIG.BASE_URL}/api/permissions/toggle`,
  PERMISSIONS_RECHTE: (vereinId, rolleId) => `${API_CONFIG.BASE_URL}/api/permissions/rechte/${vereinId}/${rolleId}`,
};

export default API_CONFIG;
