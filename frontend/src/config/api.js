// API Konfiguration für Multi-Tenant App
const API_CONFIG = {
  // � PRODUCTION URL (AWS Lambda) - Für TestFlight/Production:
  BASE_URL: process.env.REACT_APP_API_URL || 'https://crfdc7s6frt3rvczcg7l7xmddq0gjnxr.lambda-url.eu-central-1.on.aws',
  
  // 🏠 LOKALE ENTWICKLUNG (Port 8001)
  // BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8001',
  
  // � LOKALES NETZWERK TESTING (gleiche WiFi)
  // BASE_URL: process.env.REACT_APP_API_URL || 'http://192.168.178.27:8001',
  
  // TIMEOUT SETTINGS
  TIMEOUT: 10000, // 10 Sekunden
  
  // RETRY SETTINGS
  MAX_RETRIES: 3,
};

// API URLs
export const API_URLS = {
  // Auth
  AUTH_BASE: `${API_CONFIG.BASE_URL}/api/auth`,
  AUTH_USER: (userId) => `${API_CONFIG.BASE_URL}/api/auth/user/${userId}`,
  
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
  ROLES: `${API_CONFIG.BASE_URL}/api/roles/list`,
  PERMISSIONS_BY_VEREIN: (vereinId) => `${API_CONFIG.BASE_URL}/api/permissions/verein/${vereinId}`,
  PERMISSIONS_TOGGLE: `${API_CONFIG.BASE_URL}/api/permissions/toggle`,
  PERMISSIONS_RECHTE: (vereinId, rolleId) => `${API_CONFIG.BASE_URL}/api/permissions/rechte/${vereinId}/${rolleId}`,
};

export default API_CONFIG;
