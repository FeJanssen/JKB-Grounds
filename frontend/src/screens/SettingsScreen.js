import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { API_BASE_URL } from '../config/baseUrl';
import LegalModal from '../components/legal/LegalModal';
import { exportUserData, deleteUserData, getDeletionPolicy } from '../utils/dataExport';

const SettingsScreen = ({ changeTab }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userBookings, setUserBookings] = useState([]);
  const [userProfile, setUserProfile] = useState({
    id: null,
    name: '',
    email: '',
    geschlecht: '',
  });
  
  // Modal States
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingProfile, setEditingProfile] = useState({});
  const [editingField, setEditingField] = useState('');
  const [saving, setSaving] = useState(false);

  // Legal Modal States
  const [legalModalVisible, setLegalModalVisible] = useState(false);
  const [currentDocument, setCurrentDocument] = useState(null);

  const { currentUser, setUser, getUser, clearUser } = useUser();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      let userId = currentUser?.id;
      
      if (!userId) {
        const storedUser = await getUser();
        userId = storedUser?.id;
      }
      
      if (!userId) {
        window.alert('Fehler: Keine Benutzer-ID verfügbar. Bitte melde dich erneut an.');
        return;
      }

      console.log('Lade Daten für User ID:', userId);

      await Promise.all([
        loadUserProfile(userId),
        loadUserBookings(userId)
      ]);
      
    } catch (error) {
      console.error('Fehler beim Laden der User-Daten:', error);
      Alert.alert(
        'Fehler',
        'Daten konnten nicht geladen werden.',
        [{ text: 'Nochmal versuchen', onPress: () => loadUserData() }]
      );
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async (userId) => {
    try {
      console.log('Lade Profil für User:', userId);
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        const userData = data.user;
        
        console.log('Profil geladen:', userData);
        
        setUserProfile({
          id: userData.id,
          name: userData.name || '',
          email: userData.email || '',
          geschlecht: userData.geschlecht || '',
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Profil konnte nicht geladen werden');
      }
    } catch (error) {
      console.error('Fehler beim Laden des Profils:', error);
      throw error;
    }
  };

  const loadUserBookings = async (userId) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      console.log('🔍 Lade Buchungen für User:', userId, 'ab:', today);
      
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/bookings?from_date=${today}`);
      
      console.log('📡 Response Status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 API Response:', data);
        console.log('📅 Buchungen geladen:', data.bookings?.length || 0);
        
        if (data.bookings && data.bookings.length > 0) {
          data.bookings.forEach((booking, index) => {
            console.log(`   ${index + 1}. ${booking.datum} ${booking.uhrzeit_von}-${booking.uhrzeit_bis} Status: ${booking.status}`);
          });
        }
        
        const futureBookings = (data.bookings || []).filter(booking => {
          const bookingDate = new Date(booking.datum);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          return bookingDate >= today;
        }).sort((a, b) => new Date(a.datum) - new Date(b.datum));
        
        console.log('✅ Zukünftige Buchungen:', futureBookings.length);
        setUserBookings(futureBookings);
      } else {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ Fehler beim Laden der Buchungen:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  };

  const cancelBooking = (booking) => {
    console.log('🗑️ Stornieren Button geklickt für Buchung:', booking.id);
    
    // Web-kompatibles Confirm statt Alert.alert
    const confirmed = window.confirm(
      `Möchten Sie die Buchung für ${booking.platz?.name} am ${formatDate(booking.datum)} um ${booking.uhrzeit_von.substring(0, 5)} Uhr wirklich stornieren?`
    );
    
    if (confirmed) {
      console.log('✅ User hat Stornierung bestätigt');
      confirmCancelBooking(booking.id);
    } else {
      console.log('❌ User hat Stornierung abgebrochen');
    }
  };

  const confirmCancelBooking = async (bookingId) => {
    try {
      console.log('🗑️ Storniere Buchung:', bookingId);
      
      // AsyncStorage importieren
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      
      // User-ID für Authentifizierung holen - verschiedene Quellen versuchen
      let userId = userProfile.id;
      
      if (!userId) {
        // Versuche aus AsyncStorage
        userId = await AsyncStorage.getItem('userId') || 
                 await AsyncStorage.getItem('user_id') || 
                 await AsyncStorage.getItem('nutzer_id');
      }
      
      if (!userId) {
        const allKeys = await AsyncStorage.getAllKeys();
        console.error('❌ Keine User-ID verfügbar in:', { userProfile, AsyncStorageKeys: allKeys });
        window.alert('Fehler: Keine Benutzer-ID verfügbar. Bitte melde dich erneut an.');
        return;
      }
      
      console.log('👤 Verwende User-ID für Stornierung:', userId);
      
      const response = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userId
        }
      });

      console.log('📡 Cancel Response Status:', response.status);
      console.log('📡 Cancel Response Headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Stornierung erfolgreich:', result);
        window.alert('Buchung wurde erfolgreich storniert.');
        
        // Reload user data to update the bookings list
        await loadUserData();
      } else {
        const errorData = await response.text();
        console.error('❌ Stornierung fehlgeschlagen:', response.status, errorData);
        
        try {
          const errorJson = JSON.parse(errorData);
          console.log('📋 Detaillierte Fehlerinfo:', errorJson);
        } catch (e) {
          console.log('📋 Fehlertext (nicht JSON):', errorData);
        }
        
        if (response.status === 404) {
          window.alert('Fehler: Buchung wurde nicht gefunden.');
        } else if (response.status === 401) {
          window.alert('Fehler: Authentifizierung fehlgeschlagen. Bitte melde dich erneut an.');
        } else if (response.status === 403) {
          window.alert('Fehler: Sie haben keine Berechtigung, diese Buchung zu stornieren.');
        } else if (response.status === 400) {
          window.alert('Fehler: Buchung kann nicht storniert werden (möglicherweise zu spät).');
        } else {
          window.alert(`Fehler: Buchung konnte nicht storniert werden (${response.status}). Bitte versuchen Sie es später erneut.`);
        }
      }
    } catch (error) {
      console.error('❌ Exception beim Stornieren:', error);
      window.alert('Fehler: Verbindungsfehler beim Stornieren. Bitte überprüfen Sie Ihre Internetverbindung.');
    }
  };

  const startEditProfile = (field) => {
    setEditingField(field);
    setEditingProfile({ ...userProfile });
    setEditModalVisible(true);
  };

  const saveProfileChanges = async () => {
    try {
      setSaving(true);
      
      const userId = userProfile.id;
      if (!userId) {
        throw new Error('Keine Benutzer-ID verfügbar');
      }

      const updateData = {};
      
      if (editingField === 'name' && editingProfile.name !== userProfile.name) {
        updateData.name = editingProfile.name;
      }
      
      if (editingField === 'email' && editingProfile.email !== userProfile.email) {
        updateData.email = editingProfile.email;
      }
      
      if (editingField === 'geschlecht' && editingProfile.geschlecht !== userProfile.geschlecht) {
        updateData.geschlecht = editingProfile.geschlecht;
      }
      
      if (editingField === 'password' && editingProfile.password) {
        updateData.password = editingProfile.password;
      }

      if (Object.keys(updateData).length === 0) {
        window.alert('Keine Änderungen: Es wurden keine Änderungen vorgenommen.');
        setEditModalVisible(false);
        return;
      }

      console.log('Sende Update:', updateData);

      const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Profil Update erfolgreich:', data);
        
        const updatedProfile = { ...userProfile, ...data.user };
        setUserProfile(updatedProfile);
        
        const updatedUser = { ...currentUser, ...data.user };
        await setUser(updatedUser);
        
        setEditModalVisible(false);
        window.alert('Erfolg: Profil wurde aktualisiert.');
      } else {
        throw new Error(data.detail || 'Profil konnte nicht aktualisiert werden');
      }
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      Alert.alert('Fehler', error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Abmelden',
      'Möchten Sie sich wirklich abmelden?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Abmelden',
          onPress: async () => {
            await clearUser();
            window.alert('Abgemeldet: Sie wurden erfolgreich abgemeldet.');
          }
        }
      ]
    );
  };

  // ✅ DSGVO-KONFORME DATENEXPORT-FUNKTION
  const handleDataExport = async () => {
    console.log('🔍 handleDataExport wurde aufgerufen');
    
    try {
      console.log('🔍 Export wird direkt gestartet...');
      const userId = currentUser?.id;
      console.log('🔍 User ID:', userId);
      if (!userId) {
        throw new Error('Benutzer-ID nicht verfügbar');
      }
      console.log('🔍 Rufe exportUserData auf...');
      await exportUserData(userId);
      console.log('🔍 Export erfolgreich abgeschlossen');
    } catch (error) {
      console.error('🔍 Datenexport Fehler:', error);
      Alert.alert('Fehler', error.message || 'Export fehlgeschlagen');
    }
  };

  const performDataExport = async () => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      
      // Sammle alle Daten
      const exportData = {
        profile: userProfile,
        bookings: userBookings,
        exportDate: new Date().toISOString(),
        appVersion: '1.0.0'
      };

      // Erstelle Download (für Web)
      if (typeof window !== 'undefined') {
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `jkb-grounds-daten-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        Alert.alert('Export erfolgreich', 'Ihre Daten wurden heruntergeladen.');
      }
    } catch (error) {
      console.error('Export Error:', error);
      Alert.alert('Fehler', 'Datenexport fehlgeschlagen.');
    }
  };

  // ✅ DSGVO-KONFORME KONTOLÖSCHUNG
  const handleDataDeletion = () => {
    Alert.alert(
      'Konto löschen (Art. 17 DSGVO)',
      'Möchten Sie Ihr Konto und alle damit verbundenen Daten unwiderruflich löschen?\n\nHinweis: Buchungsdaten unterliegen steuerrechtlichen Aufbewahrungsfristen (10 Jahre) und können nicht sofort gelöscht werden.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { 
          text: 'Löschen',
          style: 'destructive',
          onPress: () => confirmAccountDeletion()
        }
      ]
    );
  };

  const confirmAccountDeletion = () => {
    Alert.prompt(
      'Konto löschen bestätigen',
      'Geben Sie Ihr Passwort ein, um die Löschung zu bestätigen:',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { 
          text: 'Endgültig löschen',
          style: 'destructive',
          onPress: async (password) => {
            if (!password) {
              Alert.alert('Fehler', 'Passwort erforderlich');
              return;
            }
            
            try {
              const userId = currentUser?.id;
              if (!userId) {
                throw new Error('Benutzer-ID nicht verfügbar');
              }
              
              await deleteUserData(userId, password);
              
              // Logout und zur Login-Seite
              await clearUser();
              
              Alert.alert(
                'Konto gelöscht',
                'Ihr Konto wurde erfolgreich gelöscht. Sie werden zur Anmeldung weitergeleitet.',
                [{ text: 'OK' }]
              );
              
            } catch (error) {
              console.error('Account deletion error:', error);
              Alert.alert('Fehler', error.message || 'Konto konnte nicht gelöscht werden. Bitte kontaktieren Sie den Support.');
            }
          }
        }
      ],
      'secure-text'
    );
  };

  // ✅ RECHTLICHE DOKUMENTE HANDLER
  const handleDataPolicy = () => {
    setCurrentDocument('dataPolicy');
    setLegalModalVisible(true);
  };

  const handleTermsOfService = () => {
    setCurrentDocument('terms');
    setLegalModalVisible(true);
  };

  const handleImprint = () => {
    setCurrentDocument('imprint');
    setLegalModalVisible(true);
  };

  // ✅ LÖSCHUNGSRICHTLINIE ANZEIGEN
  const handleDeletionPolicy = () => {
    const policy = getDeletionPolicy();
    
    const policyText = `DSGVO-konforme Löschungsrichtlinie:

SOFORTIGE LÖSCHUNG:
${policy.immediately.map(item => `• ${item}`).join('\n')}

LÖSCHUNG NACH 30 TAGEN:
${policy.after30Days.map(item => `• ${item}`).join('\n')}

LÖSCHUNG NACH 3 JAHREN:
${policy.after3Years.map(item => `• ${item}`).join('\n')}

AUFBEWAHRUNG 10 JAHRE (Gesetzlich):
${policy.after10Years.map(item => `• ${item}`).join('\n')}

DAUERHAFT ANONYMISIERT:
${policy.neverDeleted.map(item => `• ${item}`).join('\n')}`;

    Alert.alert(
      'Löschungsrichtlinie',
      policyText,
      [{ text: 'Verstanden' }]
    );
  };

  const handleSupport = () => {
    Alert.alert(
      'Support kontaktieren',
      'Benötigen Sie Hilfe? Kontaktieren Sie uns:',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'E-Mail senden', onPress: () => openURL('mailto:support@jkb-grounds.de?subject=JKB Grounds App Support') }
      ]
    );
  };

  const handleNotificationSettings = () => {
    Alert.alert(
      'Benachrichtigungen',
      'Benachrichtigungseinstellungen werden in einer zukünftigen Version verfügbar sein.',
      [{ text: 'OK' }]
    );
  };

  const handleLanguageSettings = () => {
    Alert.alert(
      'Sprache',
      'Spracheinstellungen werden in einer zukünftigen Version verfügbar sein. Aktuell ist nur Deutsch verfügbar.',
      [{ text: 'OK' }]
    );
  };

  const openURL = (url) => {
    if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatBookingTime = (booking) => {
    return `${booking.uhrzeit_von.substring(0, 5)} - ${booking.uhrzeit_bis.substring(0, 5)}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingOverlay}>
        <ActivityIndicator size="large" color="#DC143C" />
        <Text style={styles.loadingText}>Lade Einstellungen...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Simple Clean Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Einstellungen</Text>
      </View>

      {/* CONTENT - WEB-KOMPATIBLES SCROLLING - Einfache ScrollView wie CRM */}
      <ScrollView 
        style={styles.scrollableContent}
        showsVerticalScrollIndicator={false}
        testID="settings-screen"
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={['#DC143C']}
          />
        }
      >
        {/* Buchungen Sektion - VOLLBREITE ZEILEN */}
        <View style={styles.firstSectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="calendar-outline" size={20} color="#DC143C" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Meine Buchungen ({userBookings.length})</Text>
          </View>
        </View>
        
        {userBookings.length === 0 ? (
          <View style={styles.fullWidthRow}>
            <View style={styles.rowContent}>
              <Ionicons name="calendar-outline" size={22} color="#DC143C" style={styles.rowIcon} />
              <View style={styles.rowTexts}>
                <Text style={styles.rowTitle}>Keine zukünftigen Buchungen</Text>
                <Text style={styles.rowSubtitle}>Jetzt einen Platz buchen</Text>
              </View>
              <TouchableOpacity 
                style={styles.bookNowButton}
                onPress={() => changeTab && changeTab('Booking')}
              >
                <Text style={styles.bookNowText}>Buchen</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          userBookings.map((booking) => (
            <View key={booking.id} style={styles.fullWidthRow}>
              <View style={styles.rowContent}>
                <Ionicons name="tennisball" size={22} color="#DC143C" style={styles.rowIcon} />
                <View style={styles.rowTexts}>
                  <Text style={styles.rowTitle}>
                    {booking.platz?.name || 'Platz ' + booking.platz_id}
                  </Text>
                  <Text style={styles.rowSubtitle}>
                    {formatDate(booking.datum)} • {formatBookingTime(booking)}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => cancelBooking(booking)}
                >
                  <Text style={styles.cancelButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* Profil Sektion - VOLLBREITE ZEILEN */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="person-outline" size={20} color="#DC143C" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Mein Profil</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.fullWidthRow} onPress={() => startEditProfile('name')}>
          <View style={styles.rowContent}>
            <Ionicons name="person-outline" size={22} color="#DC143C" style={styles.rowIcon} />
            <View style={styles.rowTexts}>
              <Text style={styles.rowTitle}>Name</Text>
              <Text style={styles.rowSubtitle}>{userProfile.name || 'Nicht angegeben'}</Text>
            </View>
            <Ionicons name="create-outline" size={20} color="#007AFF" style={styles.rowArrow} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.fullWidthRow} onPress={() => startEditProfile('email')}>
          <View style={styles.rowContent}>
            <Ionicons name="mail-outline" size={22} color="#DC143C" style={styles.rowIcon} />
            <View style={styles.rowTexts}>
              <Text style={styles.rowTitle}>E-Mail</Text>
              <Text style={styles.rowSubtitle}>{userProfile.email || 'Nicht angegeben'}</Text>
            </View>
            <Ionicons name="create-outline" size={20} color="#007AFF" style={styles.rowArrow} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.fullWidthRow} onPress={() => startEditProfile('geschlecht')}>
          <View style={styles.rowContent}>
            <Ionicons name="people-outline" size={22} color="#DC143C" style={styles.rowIcon} />
            <View style={styles.rowTexts}>
              <Text style={styles.rowTitle}>Geschlecht</Text>
              <Text style={styles.rowSubtitle}>{userProfile.geschlecht || 'Nicht angegeben'}</Text>
            </View>
            <Ionicons name="create-outline" size={20} color="#007AFF" style={styles.rowArrow} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.fullWidthRow} onPress={() => startEditProfile('password')}>
          <View style={styles.rowContent}>
            <Ionicons name="lock-closed-outline" size={22} color="#DC143C" style={styles.rowIcon} />
            <View style={styles.rowTexts}>
              <Text style={styles.rowTitle}>Passwort</Text>
              <Text style={styles.rowSubtitle}>••••••••</Text>
            </View>
            <Ionicons name="create-outline" size={20} color="#007AFF" style={styles.rowArrow} />
          </View>
        </TouchableOpacity>

        {/* ✅ DSGVO & DATENSCHUTZ SEKTION - VOLLBREITE ZEILEN */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#DC143C" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Datenschutz & DSGVO</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.fullWidthRow} onPress={handleDataExport}>
          <View style={styles.rowContent}>
            <Ionicons name="download-outline" size={22} color="#DC143C" style={styles.rowIcon} />
            <View style={styles.rowTexts}>
              <Text style={styles.rowTitle}>Meine Daten exportieren</Text>
              <Text style={styles.rowSubtitle}>Alle gespeicherten Daten als JSON herunterladen</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" style={styles.rowArrow} />
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.fullWidthRow} onPress={handleDataDeletion}>
          <View style={styles.rowContent}>
            <Ionicons name="trash-outline" size={22} color="#DC143C" style={styles.rowIcon} />
            <View style={styles.rowTexts}>
              <Text style={styles.rowTitle}>Konto & Daten löschen</Text>
              <Text style={styles.rowSubtitle}>Alle persönlichen Daten unwiderruflich entfernen</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" style={styles.rowArrow} />
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.fullWidthRow} onPress={handleDataPolicy}>
          <View style={styles.rowContent}>
            <Ionicons name="shield-checkmark-outline" size={22} color="#DC143C" style={styles.rowIcon} />
            <View style={styles.rowTexts}>
              <Text style={styles.rowTitle}>Datenschutzerklärung</Text>
              <Text style={styles.rowSubtitle}>Wie wir Ihre Daten verwenden</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" style={styles.rowArrow} />
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.fullWidthRow} onPress={handleDeletionPolicy}>
          <View style={styles.rowContent}>
            <Ionicons name="time-outline" size={22} color="#DC143C" style={styles.rowIcon} />
            <View style={styles.rowTexts}>
              <Text style={styles.rowTitle}>Löschungsrichtlinie</Text>
              <Text style={styles.rowSubtitle}>DSGVO-konforme Speicherfristen</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" style={styles.rowArrow} />
          </View>
        </TouchableOpacity>

        {/* ✅ APP-EINSTELLUNGEN SEKTION - VOLLBREITE ZEILEN */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="settings-outline" size={20} color="#DC143C" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>App-Einstellungen</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.fullWidthRow} onPress={handleNotificationSettings}>
          <View style={styles.rowContent}>
            <Ionicons name="notifications-outline" size={22} color="#DC143C" style={styles.rowIcon} />
            <View style={styles.rowTexts}>
              <Text style={styles.rowTitle}>Benachrichtigungen</Text>
              <Text style={styles.rowSubtitle}>Push-Nachrichten verwalten</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" style={styles.rowArrow} />
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.fullWidthRow} onPress={handleLanguageSettings}>
          <View style={styles.rowContent}>
            <Ionicons name="language-outline" size={22} color="#DC143C" style={styles.rowIcon} />
            <View style={styles.rowTexts}>
              <Text style={styles.rowTitle}>Sprache</Text>
              <Text style={styles.rowSubtitle}>Deutsch</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" style={styles.rowArrow} />
          </View>
        </TouchableOpacity>

        {/* ✅ RECHTLICHES & SUPPORT SEKTION - VOLLBREITE ZEILEN */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="document-text-outline" size={20} color="#DC143C" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Rechtliches & Support</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.fullWidthRow} onPress={handleTermsOfService}>
          <View style={styles.rowContent}>
            <Ionicons name="document-outline" size={22} color="#DC143C" style={styles.rowIcon} />
            <View style={styles.rowTexts}>
              <Text style={styles.rowTitle}>Allgemeine Geschäftsbedingungen</Text>
              <Text style={styles.rowSubtitle}>Nutzungsbedingungen lesen</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" style={styles.rowArrow} />
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.fullWidthRow} onPress={handleImprint}>
          <View style={styles.rowContent}>
            <Ionicons name="business-outline" size={22} color="#DC143C" style={styles.rowIcon} />
            <View style={styles.rowTexts}>
              <Text style={styles.rowTitle}>Impressum</Text>
              <Text style={styles.rowSubtitle}>Anbieterinformationen</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" style={styles.rowArrow} />
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.fullWidthRow} onPress={handleSupport}>
          <View style={styles.rowContent}>
            <Ionicons name="chatbubble-outline" size={22} color="#DC143C" style={styles.rowIcon} />
            <View style={styles.rowTexts}>
              <Text style={styles.rowTitle}>Support kontaktieren</Text>
              <Text style={styles.rowSubtitle}>Hilfe und Unterstützung</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" style={styles.rowArrow} />
          </View>
        </TouchableOpacity>

        {/* ✅ APP-INFO SEKTION - VOLLBREITE ZEILE */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="information-circle-outline" size={20} color="#DC143C" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>App-Information</Text>
          </View>
        </View>
        
        <View style={styles.fullWidthRow}>
          <View style={styles.rowContent}>
            <Text style={styles.rowIcon}>📱</Text>
            <View style={styles.rowTexts}>
              <Text style={styles.rowTitle}>App-Version</Text>
              <Text style={styles.rowSubtitle}>1.0.0 (Build 1)</Text>
            </View>
          </View>
        </View>

        {/* Logout - Vollbreite Zeile mit extra Abstand */}
        <TouchableOpacity style={styles.logoutRow} onPress={handleLogout}>
          <View style={styles.rowContent}>
            <Text style={styles.rowIcon}>🚪</Text>
            <View style={styles.rowTexts}>
              <Text style={styles.logoutTitle}>Abmelden</Text>
              <Text style={styles.logoutSubtitle}>Aus der App ausloggen</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* ✅ FOOTER mit rechtlichen Hinweisen */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Durch die Nutzung dieser App stimmen Sie unseren{' '}
            <Text style={styles.footerLink} onPress={handleTermsOfService}>
              AGBs
            </Text>
            {' '}und der{' '}
            <Text style={styles.footerLink} onPress={handleDataPolicy}>
              Datenschutzerklärung
            </Text>
            {' '}zu.
          </Text>
          <Text style={styles.footerCopyright}>
            © 2025 JKB Grounds. Alle Rechte vorbehalten.
          </Text>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingField === 'name' && 'Name bearbeiten'}
              {editingField === 'email' && 'E-Mail bearbeiten'}
              {editingField === 'geschlecht' && 'Geschlecht bearbeiten'}
              {editingField === 'password' && 'Passwort ändern'}
            </Text>

            {editingField === 'geschlecht' ? (
              <View style={styles.genderContainer}>
                {['Männlich', 'Weiblich', 'Divers'].map((gender) => (
                  <TouchableOpacity
                    key={gender}
                    style={[
                      styles.genderOption,
                      editingProfile.geschlecht === gender && styles.genderOptionSelected
                    ]}
                    onPress={() => setEditingProfile({...editingProfile, geschlecht: gender})}
                  >
                    <Text style={[
                      styles.genderOptionText,
                      editingProfile.geschlecht === gender && styles.genderOptionTextSelected
                    ]}>
                      {gender}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <TextInput
                style={styles.modalInput}
                value={editingProfile[editingField] || ''}
                onChangeText={(text) => setEditingProfile({...editingProfile, [editingField]: text})}
                placeholder={`${editingField} eingeben`}
                secureTextEntry={editingField === 'password'}
                autoFocus={true}
              />
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setEditModalVisible(false)}
                disabled={saving}
              >
                <Text style={styles.modalCancelText}>Abbrechen</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalSaveButton, saving && styles.disabledButton]}
                onPress={saveProfileChanges}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>Speichern</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Legal Modal */}
      <LegalModal
        visible={legalModalVisible}
        onClose={() => setLegalModalVisible(false)}
        document={currentDocument}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9', // Modernerer Hintergrund für vollbreite Zeilen
  },
  // ✅ MODERN LOADING OVERLAY - Glasmorphism
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(248, 250, 252, 0.95)', // Heller Overlay
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    color: '#1e293b',
    marginTop: 15,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  // Simple Clean Header
  header: {
    backgroundColor: '#fff',
    paddingTop: 20, // Safe area padding
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
  },
  // CONTENT - WEB-KOMPATIBLES SCROLLING - EXAKT wie BookingScreen
  scrollableContent: {
    flex: 1,
    padding: 0, // Angepasst für Settings (vollbreite Zeilen)
    paddingBottom: 50,     // ✅ Mehr Platz für Bottom Tab Bar (wie BookingScreen)
    height: '70vh',         // ✅ Feste Höhe für Web
    overflow: 'auto',       // ✅ Eigenes Scrolling
    maxHeight: '90vh',      // ✅ Max-Height Begrenzung
  },
  section: {
    marginBottom: 0, // KEIN Abstand - volle Breite
  },
  sectionTitle: {
    fontSize: 22, // Größer
    fontWeight: '700', // Dicker
    color: '#1e293b', // Modernes Dunkelgrau
    marginBottom: 16,
    letterSpacing: 0.3,
    textTransform: 'none', // Normale Kapitalisierung
    paddingHorizontal: 20, // Nur Text hat Padding, nicht Container
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  sectionIcon: {
    marginRight: 12,
    alignSelf: 'center',
  },
  bookingCard: {
    backgroundColor: '#ffffff',
    padding: 20, // Mehr Padding
    borderRadius: 16, // Rundere Ecken
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: 'rgba(30, 41, 59, 0.08)', // Subtilerer Schatten
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.1)', // Hauchzarter Border
  },
  bookingInfo: {
    flex: 1,
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DC143C',
  },
  bookingDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  bookingTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  cancelButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  bookNowButton: {
    backgroundColor: '#DC143C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  bookNowText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  profileLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  profileValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileValue: {
    fontSize: 16,
    color: '#666',
    marginRight: 8,
  },
  editIcon: {
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: '#ef4444', // Moderneres Rot
    padding: 18, // Mehr Padding
    borderRadius: 16, // Rundere Ecken
    alignItems: 'center',
    marginTop: 24,
    shadowColor: 'rgba(239, 68, 68, 0.25)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
    minHeight: 56, // Konsistente Höhe
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 17, // Größer
    fontWeight: '700', // Dicker
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  genderContainer: {
    marginBottom: 20,
  },
  genderOption: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  genderOptionSelected: {
    borderColor: '#DC143C',
    backgroundColor: '#e8f5e8',
  },
  genderOptionText: {
    fontSize: 16,
    color: '#666',
  },
  genderOptionTextSelected: {
    color: '#DC143C',
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#666',
    fontSize: 16,
  },
  modalSaveButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#DC143C',
    marginLeft: 8,
    alignItems: 'center',
  },
  modalSaveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  // ✅ ULTRA-MODERNE EINSTELLUNGEN STYLES
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20, // Noch rundere Ecken - sehr modern
    shadowColor: 'rgba(30, 41, 59, 0.08)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.08)',
    overflow: 'hidden', // Für perfekte Rundungen
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20, // Mehr Padding für moderne Optik
    minHeight: 72, // Konsistente Höhe
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 24, // Größere Icons
    marginRight: 16,
    width: 32, // Feste Breite für Alignment
    textAlign: 'center',
  },
  settingTexts: {
    flex: 1,
    paddingRight: 12,
  },
  settingTitle: {
    fontSize: 17, // Größer
    fontWeight: '600',
    color: '#1e293b', // Modernes Dunkelgrau
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  settingSubtitle: {
    fontSize: 15, // Größer
    color: '#64748b', // Moderneres Grau
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  settingArrow: {
    fontSize: 18, // Größer
    color: '#94a3b8', // Softer
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.15)', // Subtiler
    marginLeft: 56, // Angepasst an größere Icons
  },
  footer: {
    marginTop: 40,
    marginBottom: 50,
    paddingHorizontal: 25,
    paddingVertical: 20,
    backgroundColor: 'rgba(248, 250, 252, 0.8)',
    borderRadius: 16,
    marginHorizontal: 8,
  },
  footerText: {
    fontSize: 13, // Etwas größer
    color: '#64748b', // Moderneres Grau
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
    letterSpacing: 0.1,
  },
  footerLink: {
    color: '#DC143C',
    fontWeight: '600', // Dicker
  },
  footerCopyright: {
    fontSize: 12, // Größer
    color: '#94a3b8', // Softer
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  
  // ✅ VOLLBREITE ZEILEN STYLES
  firstSectionHeader: {
    paddingHorizontal: 0, // KOMPLETT VOLLBREIT
    paddingVertical: 12,
    backgroundColor: 'rgba(248, 250, 252, 0.9)',
    marginTop: 0, // Erster Bereich ohne oberen Abstand
  },
  sectionHeader: {
    paddingHorizontal: 0, // KOMPLETT VOLLBREIT
    paddingVertical: 12,
    backgroundColor: 'rgba(248, 250, 252, 0.9)',
    marginTop: 24, // Abstand zwischen Bereichen
  },
  fullWidthRow: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.1)',
    marginHorizontal: 0, // Volle Breite
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20, // Nur Inhalts-Padding, Container ist vollbreit
    paddingVertical: 16,
  },
  rowIcon: {
    marginRight: 16,
    width: 30,
    textAlign: 'center',
    alignSelf: 'center',
  },
  rowTexts: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  rowSubtitle: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  rowArrow: {
    marginLeft: 8,
    alignSelf: 'center',
  },
  
  // ✅ LOGOUT ROW STYLES
  logoutRow: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(239, 68, 68, 0.1)',
    marginTop: 32, // Größerer Abstand vor dem Logout-Button
  },
  logoutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: 2,
  },
  logoutSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
  },
});

export default SettingsScreen;