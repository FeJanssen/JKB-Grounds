// Environment Configuration
const isDevelopment = process.env.NODE_ENV === 'development' || __DEV__;

export const ENV_CONFIG = {
  // Development (Lokal)
  development: {
    API_BASE_URL: 'http://localhost:8001', // Lokaler Backend-Server
    ENV_NAME: 'DEVELOPMENT'
  },
  
  // Production (AWS Lambda)
  production: {
    API_BASE_URL: 'https://crfdc7s6frt3rvczcg7l7xmddq0gjnxr.lambda-url.eu-central-1.on.aws',
    ENV_NAME: 'PRODUCTION'
  }
};

// Aktuelle Umgebung
export const CURRENT_ENV = isDevelopment ? ENV_CONFIG.development : ENV_CONFIG.production;
export const API_BASE_URL = CURRENT_ENV.API_BASE_URL;

console.log(`🌍 Running in: ${CURRENT_ENV.ENV_NAME}`);
console.log(`📡 API URL: ${API_BASE_URL}`);
