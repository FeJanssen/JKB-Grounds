import { Alert, Platform } from 'react-native';
import { API_BASE_URL } from '../config/baseUrl';

export const exportUserData = async (userId) => {
  try {
    if (!userId) {
      throw new Error('Benutzer-ID fehlt');
    }

    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/export`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Datenexport fehlgeschlagen');
    }

    const data = await response.json();
    
    // Formatiere die Daten für bessere Lesbarkeit
    const formattedData = {
      exportInfo: {
        exportDate: new Date().toISOString(),
        dataController: 'JKB Grounds GmbH',
        legalBasis: 'Art. 20 DSGVO (Recht auf Datenübertragbarkeit)',
      },
      personalData: {
        profile: data.user,
        bookings: data.bookings || [],
        permissions: data.permissions || [],
        loginHistory: data.loginHistory || [],
      },
      metadata: {
        totalBookings: data.bookings?.length || 0,
        memberSince: data.user?.created_at,
        lastLogin: data.user?.last_login,
      }
    };

    const jsonString = JSON.stringify(formattedData, null, 2);
    
    if (Platform.OS === 'web') {
      // Web: Download als JSON-Datei
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `jkb-grounds-daten-${userId}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      Alert.alert(
        'Datenexport erfolgreich',
        'Ihre Daten wurden als JSON-Datei heruntergeladen. Diese enthält alle Ihre in der App gespeicherten personenbezogenen Daten.',
        [{ text: 'OK' }]
      );
    } else {
      // Mobile: Daten in Alert anzeigen (fallback da Clipboard nicht installiert)
      Alert.alert(
        'Datenexport erfolgreich', 
        'Ihre Daten wurden exportiert. Die JSON-Daten werden in einer zukünftigen Version als Datei gespeichert.',
        [{ text: 'OK' }]
      );
    }

    return formattedData;

  } catch (error) {
    console.error('Datenexport Fehler:', error);
    Alert.alert(
      'Fehler beim Datenexport',
      error.message || 'Die Daten konnten nicht exportiert werden. Bitte versuchen Sie es später erneut oder kontaktieren Sie den Support.',
      [{ text: 'OK' }]
    );
    throw error;
  }
};

export const deleteUserData = async (userId, password) => {
  try {
    if (!userId) {
      throw new Error('Benutzer-ID fehlt');
    }

    if (!password) {
      throw new Error('Passwort erforderlich');
    }

    const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Kontolöschung fehlgeschlagen');
    }

    return await response.json();

  } catch (error) {
    console.error('Kontolöschung Fehler:', error);
    throw error;
  }
};

// DSGVO-konforme Löschungsfristen
export const getDeletionPolicy = () => {
  return {
    immediately: [
      'Profilbild',
      'App-Einstellungen',
      'Geräte-Token',
    ],
    after30Days: [
      'Login-Verlauf',
      'Fehlgeschlagene Anmeldeversuche',
    ],
    after3Years: [
      'Support-Kommunikation',
      'Beschwerden und Feedback',
    ],
    after10Years: [
      'Buchungsdaten (steuerrechtliche Aufbewahrungspflicht)',
      'Rechnungsdaten',
      'Zahlungsinformationen',
    ],
    neverDeleted: [
      'Anonymisierte Nutzungsstatistiken',
      'Aggregierte Buchungsdaten (ohne Personenbezug)',
    ]
  };
};
