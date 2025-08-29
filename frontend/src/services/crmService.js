// Universelle Imports für Mobile und Web
let AsyncStorage;
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (e) {
  // AsyncStorage nicht verfügbar (Web-Browser)
  AsyncStorage = null;
}

const API_BASE_URL = 'https://jkb-grounds-production.up.railway.app/api/crm';

const getHeaders = async () => {
  try {
    let token = null;
    
    // PLATTFORM-ERKENNUNG: Web Browser hat Priorität
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      // 🌐 WEB BROWSER - ERSTE PRIORITÄT
      console.log('🔍 CRM Service - Web: Lade Token aus localStorage...');
      
      // DEBUG: Zeige localStorage Inhalt (nur im Development)
      if (process.env.NODE_ENV === 'development') {
        console.log('📋 localStorage Inhalt:');
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          const value = localStorage.getItem(key);
          console.log(`  ${key}: ${value}`);
        }
      }
      
      // Suche nach Token in verschiedenen Keys
      token = localStorage.getItem('token') || 
              localStorage.getItem('authToken') ||
              localStorage.getItem('accessToken') ||
              localStorage.getItem('jwt') ||
              localStorage.getItem('access_token') ||
              localStorage.getItem('bearerToken');
      
      console.log('🌐 Web Token gefunden:', token ? 'JA' : 'NEIN');
      
    } else if (AsyncStorage) {
      // 📱 REACT NATIVE MOBILE APP - ZWEITE PRIORITÄT
      console.log('🔍 CRM Service - Mobile: Lade Token aus AsyncStorage...');
      
      try {
        // Suche nach Token in verschiedenen Keys
        token = await AsyncStorage.getItem('token') || 
                await AsyncStorage.getItem('authToken') ||
                await AsyncStorage.getItem('accessToken') ||
                await AsyncStorage.getItem('jwt') ||
                await AsyncStorage.getItem('access_token') ||
                await AsyncStorage.getItem('bearerToken');
        
        console.log('📱 Mobile Token gefunden:', token ? 'JA' : 'NEIN');
        
      } catch (asyncError) {
        console.error('❌ AsyncStorage Fehler:', asyncError);
        token = null;
      }
      
    } else {
      // 🚫 KEINE PLATTFORM ERKANNT
      console.warn('⚠️ Weder localStorage (Web) noch AsyncStorage (Mobile) verfügbar!');
    }
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Token hinzufügen wenn vorhanden
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('🔑 CRM Service - Token hinzugefügt');
      
      // Debug: Token Preview (nur die ersten 30 Zeichen)
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Token Preview:', token.substring(0, 30) + '...');
      }
    } else {
      console.warn('⚠️ CRM Service - Kein Token gefunden!');
    }
    
    return headers;
    
  } catch (error) {
    console.error('❌ CRM Service - Fehler beim Token laden:', error);
    return {
      'Content-Type': 'application/json',
    };
  }
};

export const crmService = {
  // Alle bestätigten Nutzer abrufen
  async getUsers() {
    try {
      console.log('🔄 CRM Service - Lade alle Nutzer...');
      
      const headers = await getHeaders();
      
      const response = await fetch(`${API_BASE_URL}/users`, { 
        method: 'GET',
        headers: headers
      });
      
      console.log('📡 Users Response Status:', response.status);
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('❌ Users API Error:', response.status, data);
        throw new Error(data.detail || `API Fehler ${response.status}: Fehler beim Laden der Nutzer`);
      }
      
      console.log('✅ CRM Service - Nutzer geladen:', data?.data?.length || 0);
      return data.data || [];
    } catch (error) {
      console.error('CRM Service - getUsers:', error);
      throw error;
    }
  },

  // Ausstehende Registrierungen abrufen
  async getPendingRegistrations() {
    try {
      console.log('🔄 CRM Service - Lade ausstehende Registrierungen...');
      
      const headers = await getHeaders();
      
      const response = await fetch(`${API_BASE_URL}/registrations/pending`, { 
        method: 'GET',
        headers: headers
      });
      
      console.log('📡 Pending Response Status:', response.status);
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('❌ Pending API Error:', response.status, data);
        throw new Error(data.detail || `API Fehler ${response.status}: Fehler beim Laden der Registrierungen`);
      }
      
      console.log('✅ CRM Service - Registrierungen geladen:', data?.data?.length || 0);
      return data.data || [];
    } catch (error) {
      console.error('CRM Service - getPendingRegistrations:', error);
      throw error;
    }
  },

  // Registrierung bestätigen
  async approveRegistration(id) {
    try {
      console.log('🔄 CRM Service - Bestätige Registrierung:', id);
      
      const headers = await getHeaders();
      
      const response = await fetch(`${API_BASE_URL}/registrations/${id}/approve`, {
        method: 'PUT',
        headers: headers
      });
      
      console.log('📡 Approve Registration Response Status:', response.status);
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('❌ Approve Registration API Error:', response.status, data);
        
        if (response.status === 404) {
          throw new Error('Registrierung nicht gefunden');
        }
        throw new Error(data.detail || `API Fehler ${response.status}: Fehler beim Bestätigen der Registrierung`);
      }
      
      console.log('✅ CRM Service - Registrierung bestätigt:', data);
      return data;
    } catch (error) {
      console.error('CRM Service - approveRegistration:', error);
      throw error;
    }
  },

  // Registrierung ablehnen
  async rejectRegistration(id) {
    try {
      console.log('🔄 CRM Service - Lehne Registrierung ab:', id);
      
      const headers = await getHeaders();
      
      const response = await fetch(`${API_BASE_URL}/registrations/${id}/reject`, {
        method: 'DELETE',
        headers: headers
      });
      
      console.log('📡 Reject Registration Response Status:', response.status);
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('❌ Reject Registration API Error:', response.status, data);
        
        if (response.status === 404) {
          throw new Error('Registrierung nicht gefunden');
        }
        throw new Error(data.detail || `API Fehler ${response.status}: Fehler beim Ablehnen der Registrierung`);
      }
      
      console.log('✅ CRM Service - Registrierung abgelehnt:', data);
      return data;
    } catch (error) {
      console.error('CRM Service - rejectRegistration:', error);
      throw error;
    }
  },

  // Neuen Nutzer hinzufügen
  async createUser(userData) {
    try {
      console.log('🔄 CRM Service - Erstelle neuen Nutzer:', userData.email);
      
      const headers = await getHeaders();
      
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(userData)
      });
      
      console.log('📡 Create User Response Status:', response.status);
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('❌ Create User API Error:', response.status, data);
        
        if (response.status === 400) {
          throw new Error('Ungültige Nutzerdaten oder Email bereits registriert');
        }
        throw new Error(data.detail || `API Fehler ${response.status}: Fehler beim Erstellen des Nutzers`);
      }
      
      console.log('✅ CRM Service - Nutzer erstellt:', data);
      return data;
    } catch (error) {
      console.error('CRM Service - createUser:', error);
      throw error;
    }
  },

  // Nutzer bearbeiten
  async updateUser(id, userData) {
    try {
      console.log('🔄 CRM Service - Bearbeite Nutzer:', id);
      
      const headers = await getHeaders();
      
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(userData)
      });
      
      console.log('📡 Update User Response Status:', response.status);
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('❌ Update User API Error:', response.status, data);
        
        if (response.status === 404) {
          throw new Error('Nutzer nicht gefunden');
        }
        if (response.status === 400) {
          throw new Error('Ungültige Nutzerdaten');
        }
        throw new Error(data.detail || `API Fehler ${response.status}: Fehler beim Bearbeiten des Nutzers`);
      }
      
      console.log('✅ CRM Service - Nutzer bearbeitet:', data);
      return data;
    } catch (error) {
      console.error('CRM Service - updateUser:', error);
      throw error;
    }
  },

  // Nutzer löschen
  async deleteUser(id) {
    try {
      console.log('🔄 CRM Service - Lösche Nutzer:', id);
      
      const headers = await getHeaders();
      
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'DELETE',
        headers: headers
      });
      
      console.log('📡 Delete User Response Status:', response.status);
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('❌ Delete User API Error:', response.status, data);
        
        if (response.status === 404) {
          throw new Error('Nutzer nicht gefunden');
        }
        throw new Error(data.detail || `API Fehler ${response.status}: Fehler beim Löschen des Nutzers`);
      }
      
      console.log('✅ CRM Service - Nutzer gelöscht:', data);
      return data;
    } catch (error) {
      console.error('CRM Service - deleteUser:', error);
      throw error;
    }
  },

  // Statistiken abrufen
  async getStats() {
    try {
      console.log('🔄 CRM Service - Lade Statistiken...');
      
      const headers = await getHeaders();
      
      const response = await fetch(`${API_BASE_URL}/stats`, { 
        method: 'GET',
        headers: headers
      });
      
      console.log('📡 Stats Response Status:', response.status);
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('❌ Stats API Error:', response.status, data);
        throw new Error(data.detail || `API Fehler ${response.status}: Fehler beim Laden der Statistiken`);
      }
      
      console.log('✅ CRM Service - Statistiken geladen:', data.data);
      return data.data || { total: 0, pending: 0 };
    } catch (error) {
      console.error('CRM Service - getStats:', error);
      throw error;
    }
  },

  // Rollen abrufen
  async getRoles() {
    try {
      console.log('🔄 CRM Service - Lade Rollen...');
      
      const headers = await getHeaders();
      
      const response = await fetch(`${API_BASE_URL}/roles`, { 
        method: 'GET',
        headers: headers
      });
      
      console.log('📡 Roles Response Status:', response.status);
      
      if (!response.ok) {
        console.log('⚠️ CRM Service - Roles API nicht verfügbar, verwende Fallback');
        // Fallback zu Standard-Rollen
        return [
          { id: 1, name: 'Admin' },
          { id: 2, name: 'Trainer' },
          { id: 3, name: 'Mannschaftsführer' },
          { id: 4, name: 'Mitglied' },
          { id: 5, name: 'Gast' }
        ];
      }
      
      const data = await response.json();
      console.log('✅ CRM Service - Rollen geladen:', data?.data?.length || 0);
      return data.data || [
        { id: 1, name: 'Admin' },
        { id: 2, name: 'Trainer' },
        { id: 3, name: 'Mannschaftsführer' },
        { id: 4, name: 'Mitglied' },
        { id: 5, name: 'Gast' }
      ];
    } catch (error) {
      console.error('CRM Service - getRoles:', error);
      // Fallback zu Standard-Rollen bei Fehler
      console.log('⚠️ CRM Service - Fallback zu Standard-Rollen');
      return [
        { id: 1, name: 'Admin' },
        { id: 2, name: 'Trainer' },
        { id: 3, name: 'Mannschaftsführer' },
        { id: 4, name: 'Mitglied' },
        { id: 5, name: 'Gast' }
      ];
    }
  },

  // Erweiterte Nutzersuche
  async searchUsers(query, filters = {}) {
    try {
      console.log('🔄 CRM Service - Erweiterte Suche:', query, filters);
      
      const headers = await getHeaders();
      
      const searchParams = new URLSearchParams({
        q: query || '',
        ...filters
      });
      
      const response = await fetch(`${API_BASE_URL}/users/search?${searchParams}`, { 
        method: 'GET',
        headers: headers
      });
      
      console.log('📡 Search Response Status:', response.status);
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('❌ Search API Error:', response.status, data);
        throw new Error(data.detail || `API Fehler ${response.status}: Fehler bei der Suche`);
      }
      
      console.log('✅ CRM Service - Suche abgeschlossen:', data?.data?.length || 0);
      return data.data || [];
    } catch (error) {
      console.error('CRM Service - searchUsers:', error);
      throw error;
    }
  },

  // Nutzer exportieren
  async exportUsers(format = 'csv') {
    try {
      console.log('🔄 CRM Service - Exportiere Nutzer als:', format);
      
      const headers = await getHeaders();
      
      const response = await fetch(`${API_BASE_URL}/users/export?format=${format}`, { 
        method: 'GET',
        headers: headers
      });
      
      console.log('📡 Export Response Status:', response.status);
      
      if (!response.ok) {
        const data = await response.json();
        console.error('❌ Export API Error:', response.status, data);
        throw new Error(data.detail || `API Fehler ${response.status}: Fehler beim Exportieren`);
      }
      
      const blob = await response.blob();
      console.log('✅ CRM Service - Export erstellt');
      return blob;
    } catch (error) {
      console.error('CRM Service - exportUsers:', error);
      throw error;
    }
  }
};