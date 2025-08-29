// Zentrale Konstanten für Multi-Tenant App
export const APP_CONFIG = {
  // API Configuration
  API: {
    BASE_URL: process.env.REACT_APP_API_URL || 'https://jkb-grounds-production.up.railway.app',
    TIMEOUT: 10000,
    MAX_RETRIES: 3,
  },
  
  // Booking Configuration
  BOOKING: {
    DEFAULT_DURATION: 60, // Minuten
    TYPES: {
      PRIVATE: 'private',
      PUBLIC: 'public',
      STANDARD: 'standard' // Legacy Support
    },
    MAX_ADVANCE_DAYS: 30, // Maximale Buchung im Voraus
  },
  
  // User Roles
  ROLES: {
    ADMIN: 'admin',
    USER: 'user',
    MODERATOR: 'moderator',
    MANAGER: 'manager'
  },
  
  // UI Configuration
  UI: {
    REFRESH_INTERVAL: 30000, // 30 Sekunden
    CALENDAR_TIME_SLOTS: 30, // Minuten pro Slot
  },
  
  // Multi-Tenant Settings
  TENANT: {
    // Diese könnten später dynamisch geladen werden
    DEFAULT_VEREIN_ID: null, // Kein Default - muss dynamisch gesetzt werden
    DEFAULT_USER_ID: null,   // Kein Default - muss aus Login kommen
  }
};

// API Endpoints - dynamisch basierend auf BASE_URL
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/auth/login',
    REGISTER: '/api/auth/auth/register',
    USER: (userId) => `/api/auth/auth/user/${userId}`,
    ROLE: (userId) => `/api/users/${userId}/role`,
  },
  
  BOOKINGS: {
    CREATE: '/api/bookings/create',
    BY_DATE: (date, vereinId) => `/api/bookings/date/${date}?verein_id=${vereinId}`,
    DELETE: (bookingId) => `/api/bookings/${bookingId}`,
  },
  
  COURTS: {
    BY_VEREIN: (vereinId) => `/api/courts/verein/${vereinId}`,
    DETAILS: (courtId) => `/api/courts/${courtId}`,
  }
};

// Helper function to build full URL
export const buildApiUrl = (endpoint) => {
  return `${APP_CONFIG.API.BASE_URL}${endpoint}`;
};
