import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BookingCalendar from '../components/BookingCalender';
import { usePermissions } from '../context/PermissionContext';

const BookingScreen = ({ navigation }) => {
  const { canBook, canBookPublic, isPermissionsLoaded, loadUserPermissions } = usePermissions();
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('calendar');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentVereinId, setCurrentVereinId] = useState(null);

  useEffect(() => {
    initializeScreen();
  }, []);

  const initializeScreen = async () => {
    try {
      console.log('🚀 ENTERPRISE: Initialisiere BookingScreen');
      
      // 1. ERST Permissions laden
      await loadUserPermissions();
      
      // 2. User-ID aus AsyncStorage laden
      // ✅ KONSISTENTE USER-ID SUCHE
      let userId = await AsyncStorage.getItem('userId'); // ← Hauptkey
      if (!userId) {
        userId = await AsyncStorage.getItem('user_id'); // ← Fallback
      }
      if (!userId) {
        userId = await AsyncStorage.getItem('userId');
      }
      if (!userId) {
        userId = await AsyncStorage.getItem('currentUserId');
      }
      
      console.log('👤 ENTERPRISE: User-ID gefunden:', userId);
      
      if (!userId) {
        throw new Error('Session ungültig - bitte neu einloggen');
      }
      
      // 3. User-Daten laden
      const userUrl = `https://crfdc7s6frt3rvczcg7l7xmddq0gjnxr.lambda-url.eu-central-1.on.aws/api/auth/user/${userId}`;
      console.log('🔍 FRONTEND: Versuche User-Daten zu laden von:', userUrl);
      
      const userResponse = await fetch(userUrl);
      
      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        console.log('❌ FRONTEND: Error Response Text:', errorText);
        throw new Error(`HTTP ${userResponse.status}: ${errorText}`);
      }
      
      const userData = await userResponse.json();
      console.log('✅ FRONTEND: User-Daten erhalten:', userData);
      
      if (!userData.verein_id) {
        throw new Error('Keine Vereinszugehörigkeit gefunden');
      }
      
      // 4. Speichere IDs für zukünftige Verwendung
      await AsyncStorage.setItem('verein_id', userData.verein_id);
      
      setCurrentUserId(userId);
      setCurrentVereinId(userData.verein_id);
      
      console.log('🏢 ENTERPRISE: Verein-ID gesetzt:', userData.verein_id);
      
      // 5. DANN Courts laden
      await loadCourts(userData.verein_id);
      
      console.log('✅ ENTERPRISE: BookingScreen erfolgreich initialisiert');
      
    } catch (error) {
      console.error('❌ ENTERPRISE: Initialisierungsfehler:', error);
      Alert.alert(
        'Fehler',
        error.message || 'Fehler beim Laden der Daten',
        [
          { 
            text: 'Neu einloggen', 
            onPress: () => navigation.navigate('Login')
          }
        ]
      );
    }
  };

  const loadCourts = async (vereinId = null) => {
    try {
      setLoading(true);
      
      const targetVereinId = vereinId || currentVereinId;
      
      if (!targetVereinId) {
        throw new Error('Keine Verein-ID verfügbar');
      }
      
      console.log(`🏢 ENTERPRISE: Lade Courts für Verein ${targetVereinId}`);
      
      const url = `https://crfdc7s6frt3rvczcg7l7xmddq0gjnxr.lambda-url.eu-central-1.on.aws/api/courts/verein/${targetVereinId}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Server-Fehler`);
      }
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setCourts(data.courts || []);
        console.log(`✅ ENTERPRISE: ${data.courts?.length || 0} Courts geladen`);
      } else {
        throw new Error(data.message || 'Unbekannter Fehler beim Laden der Plätze');
      }
      
    } catch (error) {
      console.error('❌ ENTERPRISE: Fehler beim Laden der Plätze:', error);
      Alert.alert(
        'Verbindungsfehler',
        'Die Plätze konnten nicht geladen werden. Bitte prüfen Sie Ihre Internetverbindung.',
        [
          { text: 'Wiederholen', onPress: () => loadCourts() },
          { text: 'Abbrechen', style: 'cancel' }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEU: Refresh Handler
  const onRefresh = async () => {
    setRefreshing(true);
    await loadCourts();
    setRefreshing(false);
  };

  const handleBooking = async (platzId, datetime, isPublic = false) => {
    try {
      // ✅ PERMISSION CHECKS VOR BUCHUNG
      if (!canBook()) {
        Alert.alert('Keine Berechtigung', 'Sie haben keine Buchungsberechtigung.');
        return;
      }

      if (isPublic && !canBookPublic()) {
        Alert.alert(
          'Keine Berechtigung', 
          'Sie haben keine Berechtigung für öffentliche Buchungen.'
        );
        return;
      }

      console.log('🏓 ENTERPRISE BOOKING REQUEST:', { platzId, datetime, isPublic });
      
      // Session-Validierung
      if (!currentUserId) {
        throw new Error('Session ungültig - bitte neu einloggen');
      }

      console.log(`📤 ENTERPRISE: Sende Buchung für User ${currentUserId}`);

      // ✅ GLEICHE API-STRUKTUR WIE BOOKINGMODAL!
      const calculateEndTime = (startTime, durationMinutes) => {
        const [hours, minutes] = startTime.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes + parseInt(durationMinutes);
        const endHours = Math.floor(totalMinutes / 60);
        const endMins = totalMinutes % 60;
        return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
      };

      const bookingData = {
        platz_id: platzId,
        date: datetime.split('T')[0],
        time: datetime.split('T')[1] + ':00',
        end_time: calculateEndTime(datetime.split('T')[1], 60) + ':00',
        duration: 60,
        type: 'standard', // ✅ REQUIRED: Buchungstyp hinzugefügt
        ist_oeffentlich: isPublic,
        verein_id: currentVereinId,
        notizen: ''
      };

      console.log('📤 ENTERPRISE: Sende Buchungsdaten:', bookingData);

      const response = await fetch('https://crfdc7s6frt3rvczcg7l7xmddq0gjnxr.lambda-url.eu-central-1.on.aws/api/bookings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': currentUserId
        },
        body: JSON.stringify(bookingData)
      });

      const data = await response.json();
      console.log('Backend Response:', data);
      
      if (response.ok && data.status === 'success') {
        Alert.alert('Erfolg', 'Buchung wurde erstellt!');
        console.log('✅ ENTERPRISE: Buchung erfolgreich erstellt');
        
        // Courts neu laden
        loadCourts();
      } else {
        console.error('❌ Backend Response:', data);
        throw new Error(data.detail || 'Buchungsfehler');
      }
      
    } catch (error) {
      console.error('❌ ENTERPRISE BOOKING ERROR:', error);
      Alert.alert('Fehler', error.message);
    }
  };

  // ✅ LOADING STATE mit Overlay wie im CRM
  if (loading || !isPermissionsLoaded()) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#DC143C" />
          <Text style={styles.loadingText}>
            {!isPermissionsLoaded() ? 'Lade Berechtigungen...' : 'Lade verfügbare Plätze...'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ✅ FIXED HEADER wie im CRM */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Platzbuchung</Text>
      </View>

      {/* ✅ VIEW MODE SELECTOR zwischen Header und Content */}
      <View style={styles.viewSelector}>
        <TouchableOpacity 
          style={[styles.viewButton, viewMode === 'calendar' && styles.activeViewButton]}
          onPress={() => setViewMode('calendar')}
        >
          <Text style={[styles.viewButtonText, viewMode === 'calendar' && styles.activeViewButtonText]}>
            Kalender
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.viewButton, viewMode === 'list' && styles.activeViewButton]}
          onPress={() => setViewMode('list')}
        >
          <Text style={[styles.viewButtonText, viewMode === 'list' && styles.activeViewButtonText]}>
            Liste
          </Text>
        </TouchableOpacity>
      </View>

      {/* ✅ CONTENT - MIT ScrollView für korrekte Web-Scroll-Behandlung */}
      {viewMode === 'calendar' ? (
        // KALENDER-ANSICHT - Einfache ScrollView wie SettingsScreen
        <ScrollView 
          style={styles.scrollableContent}
          showsVerticalScrollIndicator={false}
        >
          <BookingCalendar 
            courts={courts} 
            onBooking={handleBooking}
            canBookPublic={canBookPublic()}
            vereinId={currentVereinId}
            userId={currentUserId}  // ✅ User-ID weiterleiten
          />
        </ScrollView>
      ) : (
        // ✅ LISTEN-ANSICHT - Einfache ScrollView wie SettingsScreen
        <ScrollView 
          style={styles.scrollableContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.subtitle}>
            {courts.length > 0 
              ? `${courts.length} Plätze verfügbar` 
              : 'Keine Plätze verfügbar'
            }
          </Text>
          
          {/* Courts List */}
          {courts.length > 0 ? (
            courts.map((court) => (
              <View key={court.id} style={styles.courtCard}>
                <Text style={styles.courtName}>{court.name}</Text>
                <Text style={styles.courtDetails}>{court.platztyp}</Text>
                <Text style={styles.courtTimes}>
                  Buchbar: {court.buchbar_von || '07:00'} - {court.buchbar_bis || '22:00'}
                </Text>
                
                {/* Private Buchung - nur wenn berechtigt */}
                {canBook() ? (
                  <TouchableOpacity
                    style={styles.bookButton}
                    onPress={() => handleBooking(court.id, '2025-07-02T10:00', false)}
                  >
                    <Text style={styles.bookButtonText}>Private Buchung (Test)</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.disabledButton}>
                    <Text style={styles.disabledButtonText}>Keine Buchungsberechtigung</Text>
                  </View>
                )}
                
                {/* Öffentliche Buchung - nur wenn berechtigt */}
                {canBookPublic() ? (
                  <TouchableOpacity
                    style={[styles.bookButton, styles.publicBookButton]}
                    onPress={() => handleBooking(court.id, '2025-07-02T11:00', true)}
                  >
                    <Text style={styles.bookButtonText}>Öffentliche Buchung (Test)</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.disabledButton, styles.disabledPublicButton]}>
                    <Text style={styles.disabledButtonText}>Keine öffentliche Buchungsberechtigung</Text>
                  </View>
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Keine Plätze verfügbar</Text>
              <Text style={styles.emptyText}>
                Momentan sind keine Plätze für die Buchung verfügbar.
              </Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => loadCourts()}>
                <Text style={styles.retryButtonText}>Erneut versuchen</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Switch to Calendar Hint */}
          <View style={styles.switchHint}>
            <Text style={styles.switchHintText}>
              Tipp: Nutzen Sie die Kalender-Ansicht für eine bessere Übersicht
            </Text>
            <TouchableOpacity 
              style={styles.switchButton}
              onPress={() => setViewMode('calendar')}
            >
              <Text style={styles.switchButtonText}>Zu Kalender wechseln</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  // ✅ LOADING OVERLAY wie im CRM
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  // ✅ FIXED HEADER wie im CRM
  header: {
    backgroundColor: '#DC143C',
    paddingTop: 45,
    paddingBottom: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  // ✅ VIEW SELECTOR zwischen Header und Content
  viewSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  viewButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    marginHorizontal: 5,
    borderRadius: 8,
  },
  activeViewButton: {
    backgroundColor: '#DC143C',
  },
  viewButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  activeViewButtonText: {
    color: '#fff',
  },
  // ✅ CONTENT CONTAINER für beide Ansichten
  contentContainer: {
    flex: 1,
  },
  // ✅ WEB-KOMPATIBLES SCROLLING - EXAKT wie SettingsScreen
  scrollableContent: {
    flex: 1,
    padding: 20,
    paddingBottom: 100,     // ✅ Platz für Bottom Tab Bar
    height: '70vh',         // ✅ Feste Höhe für Web
    overflow: 'auto',       // ✅ Eigenes Scrolling
    maxHeight: '90vh',      // ✅ Max-Height Begrenzung
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    fontWeight: '600',
  },
  courtCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  courtName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  courtDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  courtTimes: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  bookButton: {
    backgroundColor: '#DC143C',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  publicBookButton: {
    backgroundColor: '#FF6B35',
  },
  bookButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  disabledPublicButton: {
    borderColor: '#ffcccc',
    backgroundColor: '#fff5f5',
  },
  disabledButtonText: {
    color: '#999',
    fontWeight: '500',
    fontSize: 14,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#DC143C',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchHint: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  switchHintText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  switchButton: {
    backgroundColor: '#DC143C',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  switchButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default BookingScreen;