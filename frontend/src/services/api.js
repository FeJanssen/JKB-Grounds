// ✅ IMPORT der zentralen Konstanten
import { buildApiUrl, API_ENDPOINTS, APP_CONFIG } from '../config/constants';

// 🚀 PRODUCTION URL (AWS Lambda) - Für AWS Deployment:
const BASE_URL = 'https://crfdc7s6frt3rvczcg7l7xmddq0gjnxr.lambda-url.eu-central-1.on.aws';

// 🔧 LOKALE ENTWICKLUNG - Zum Testen uncommentieren:
// const BASE_URL = 'http://localhost:8001';

// API URLs basierend auf der Basis-URL - KORRIGIERT!
const API_BASE_URL = `${BASE_URL}/api`;
const API_MAIN_URL = `${BASE_URL}/api`;

class ApiService {
  // Hilfsfunktion um User-ID zu holen
  // Hilfsfunktion um User-ID zu holen
async getCurrentUserId() {
  try {
    let userData = null;
    
    // React Native: AsyncStorage ZUERST versuchen
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      userData = await AsyncStorage.getItem('currentUser');
      console.log('💾 AsyncStorage userData:', userData);
    } catch (error) {
      console.log('⚠️ AsyncStorage nicht verfügbar, versuche localStorage');
      
      // Fallback: Web localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        userData = localStorage.getItem('currentUser');
        console.log('💾 localStorage userData:', userData);
      }
    }
    
    if (userData) {
      const user = JSON.parse(userData);
      console.log('👤 Parsed User:', user);
      console.log('🆔 User ID:', user.id);
      return user.id;
    }
    
    console.log('❌ Keine User-Daten gefunden');
    return null;
  } catch (error) {
    console.error('❌ Fehler beim Holen der User-ID:', error);
    return null;
  }
}

  // Hilfsfunktion für Headers mit User-ID
  async getHeaders() {
    const userId = await this.getCurrentUserId();
    return {
      'Content-Type': 'application/json',
      ...(userId && { 'X-User-ID': userId })
    };
  }

  // AUTH FUNKTIONEN
  async register(userData) {
    try {
      console.log('Register Request:', userData);
      
      const response = await fetch(`${API_BASE_URL}/auth/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      console.log('Register Response Status:', response.status);
      const data = await response.json();
      console.log('Register Response Data:', data);

      if (!response.ok) {
        throw new Error(data.detail || 'Registrierung fehlgeschlagen');
      }

      return data;
    } catch (error) {
      console.error('Register Error:', error);
      throw error;
    }
  }

  async login(credentials) {
    try {
      console.log('Login Request:', credentials);
      console.log('Login URL:', buildApiUrl(API_ENDPOINTS.AUTH.LOGIN));
      
      const response = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.LOGIN), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      console.log('Login Response Status:', response.status);
      console.log('Login Response OK:', response.ok);
      
      const data = await response.json();
      console.log('Login Response Data:', data);

      if (!response.ok) {
        console.error('Login failed with status:', response.status, data);
        throw new Error(data.detail || 'Login fehlgeschlagen');
      }

      console.log('Login successful, returning data:', data);
      return data;
    } catch (error) {
      console.error('Login Error in API:', error);
      throw error;
    }
  }

// BOOKING FUNKTIONEN
async createBooking(bookingData) {
  try {
    console.log('🎯 === BOOKING DEBUG START ===');
    console.log('🎯 Erstelle Buchung:', bookingData);
    
    // SCHRITT 1: Test ob Funktion läuft
    console.log('🔍 SCHRITT 1: Teste getCurrentUserId...');
    
    let userId = null;
    try {
      userId = await this.getCurrentUserId();
      console.log('✅ getCurrentUserId erfolgreich:', userId);
    } catch (error) {
      console.error('❌ ERROR in getCurrentUserId:', error);
    }
    
    console.log('👤 Final User-ID:', userId);
    console.log('👤 User-ID Type:', typeof userId);
    
    if (!userId) {
      console.log('❌ KRITISCHER FEHLER: User-ID ist null oder undefined!');
      console.log('🔧 LÖSUNG: User muss sich neu einloggen');
      throw new Error('Benutzer-Session abgelaufen. Bitte loggen Sie sich neu ein.');
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'X-User-ID': userId
    };
    
    console.log('📡 Sende Headers:', headers);
    console.log('📤 Sende Body:', JSON.stringify(bookingData));
    
    const response = await fetch(`${API_MAIN_URL}/bookings/create`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(bookingData)
    });

    console.log('📥 Response Status:', response.status);
    const data = await response.json();
    console.log('📥 Response Data:', data);

    if (response.ok) {
      console.log('✅ Buchung erfolgreich erstellt:', data);
      return data;
    } else {
      console.error('❌ Backend-Fehler:', data);
      throw new Error(JSON.stringify(data.detail) || 'Buchung fehlgeschlagen');
    }
  } catch (error) {
    console.error('❌ BOOKING API ERROR:', error);
    console.error('❌ Error Type:', typeof error);
    console.error('❌ Error Message:', error.message);
    throw error;
  }
}

  async cancelBooking(bookingId) {
    try {
      console.log('🗑️ Storniere Buchung:', bookingId);
      
      const headers = await this.getHeaders();
      
      const response = await fetch(`${API_MAIN_URL}/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: headers
      });

      const data = await response.json();

      if (response.ok) {
        return data;
      } else {
        throw new Error(data.detail || 'Stornierung fehlgeschlagen');
      }
    } catch (error) {
      console.error('❌ Cancel API Error:', error);
      throw error;
    }
  }

  async getBookingsByDate(date) {
    try {
      console.log('📅 Lade Buchungen für Datum:', date);
      
      const response = await fetch(`${API_MAIN_URL}/bookings/date/${date}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (response.ok) {
        return data;
      } else {
        throw new Error(data.detail || 'Buchungen konnten nicht geladen werden');
      }
    } catch (error) {
      console.error('❌ Get Bookings API Error:', error);
      throw error;
    }
  }

  async checkAvailability(courtId, date, time, duration = 60) {
    try {
      console.log('🔍 Prüfe Verfügbarkeit:', { courtId, date, time, duration });
      
      const response = await fetch(`${API_MAIN_URL}/bookings/availability/${courtId}?date=${date}&time=${time}&duration=${duration}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (response.ok) {
        return data;
      } else {
        throw new Error(data.detail || 'Verfügbarkeitsprüfung fehlgeschlagen');
      }
    } catch (error) {
      console.error('❌ Availability API Error:', error);
      throw error;
    }
  }

  // COURTS FUNKTIONEN
  async getCourts() {
    try {
      console.log('🎾 Lade Tennisplätze...');
      
      const response = await fetch(`${API_MAIN_URL}/courts`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (response.ok) {
        return data;
      } else {
        throw new Error(data.detail || 'Plätze konnten nicht geladen werden');
      }
    } catch (error) {
      console.error('❌ Courts API Error:', error);
      throw error;
    }
  }

  // USER FUNKTIONEN
  async getUserProfile(userId) {
    try {
      console.log('👤 Lade User-Profil:', userId);
      
      const response = await fetch(`${API_MAIN_URL}/users/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (response.ok) {
        return data;
      } else {
        throw new Error(data.detail || 'Profil konnte nicht geladen werden');
      }
    } catch (error) {
      console.error('❌ Profile API Error:', error);
      throw error;
    }
  }

  async updateUserProfile(userId, updateData) {
    try {
      console.log('✏️ Update User-Profil:', userId, updateData);
      
      const response = await fetch(`${API_MAIN_URL}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (response.ok) {
        return data;
      } else {
        throw new Error(data.detail || 'Profil konnte nicht aktualisiert werden');
      }
    } catch (error) {
      console.error('❌ Update Profile API Error:', error);
      throw error;
    }
  }

  async getUserBookings(userId, fromDate = null) {
    try {
      console.log('📋 Lade User-Buchungen:', userId, fromDate);
      
      let url = `${API_MAIN_URL}/users/${userId}/bookings`;
      if (fromDate) {
        url += `?from_date=${fromDate}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (response.ok) {
        return data;
      } else {
        throw new Error(data.detail || 'Buchungen konnten nicht geladen werden');
      }
    } catch (error) {
      console.error('❌ User Bookings API Error:', error);
      throw error;
    }
  }

  // DEBUG FUNKTIONEN
  async getAllBookings() {
    try {
      console.log('🐛 DEBUG: Lade alle Buchungen...');
      
      const response = await fetch(`${API_MAIN_URL}/bookings/debug/all`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (response.ok) {
        return data;
      } else {
        throw new Error(data.detail || 'Debug-Buchungen konnten nicht geladen werden');
      }
    } catch (error) {
      console.error('❌ Debug API Error:', error);
      throw error;
    }
  }

  // 🔑 PASSWORT-RESET FUNKTIONEN
  async requestPasswordReset(email) {
    try {
      console.log('🔑 Passwort-Reset anfordern für:', email);
      
      const response = await fetch(`${API_MAIN_URL}/auth/auth/request-password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Passwort-Reset Email gesendet');
        return data;
      } else {
        throw new Error(data.detail || 'Reset-Email konnte nicht gesendet werden');
      }
    } catch (error) {
      console.error('❌ Password Reset Request Error:', error);
      throw error;
    }
  }

  async verifyResetToken(token) {
    try {
      console.log('🔍 Token verifizieren:', token);
      
      const response = await fetch(`${API_MAIN_URL}/auth/auth/verify-reset-token?token=${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Token-Verifikation erfolgreich:', data);
        return data;
      } else {
        throw new Error(data.detail || 'Token-Verifikation fehlgeschlagen');
      }
    } catch (error) {
      console.error('❌ Token Verification Error:', error);
      throw error;
    }
  }

  async resetPassword(token, newPassword) {
    try {
      console.log('🔒 Passwort zurücksetzen mit Token:', token);
      
      const response = await fetch(`${API_MAIN_URL}/auth/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          new_password: newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Passwort erfolgreich zurückgesetzt');
        return data;
      } else {
        throw new Error(data.detail || 'Passwort konnte nicht zurückgesetzt werden');
      }
    } catch (error) {
      console.error('❌ Password Reset Error:', error);
      throw error;
    }
  }
}

export default new ApiService();