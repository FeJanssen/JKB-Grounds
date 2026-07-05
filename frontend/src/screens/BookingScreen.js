import React, { useState, useEffect, useRef } from 'react';
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
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentVereinId, setCurrentVereinId] = useState(null);
  
  // ✅ NAVIGATION STATES - Aus BookingCalendar hierher verschoben
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [courtStartIndex, setCourtStartIndex] = useState(0);
  
  // ✅ REF für Auto-Scroll zu aktueller Zeit
  const scrollViewRef = useRef(null);
  const [shouldScrollToTime, setShouldScrollToTime] = useState(false);
  
  // ✅ CONSTANTS
  const COURTS_PER_VIEW = 3;

  useEffect(() => {
    initializeScreen();
  }, []);

  // ✅ Markiere dass wir scrollen müssen wenn Courts geladen sind
  useEffect(() => {
    if (courts.length > 0) {
      setShouldScrollToTime(true);
    }
  }, [courts]);

  const scrollToCurrentTime = () => {
    if (!scrollViewRef.current || courts.length === 0) return;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Finde die früheste buchbare Zeit aus den Courts
    let earliestHour = 7;
    courts.forEach(court => {
      if (court.buchbar_von) {
        const startHour = parseInt(court.buchbar_von.split(':')[0]);
        earliestHour = Math.min(earliestHour, startHour);
      }
    });
    
    // Berechne Anzahl der 30-Minuten-Slots bis zur aktuellen Zeit
    const slotsFromStart = (currentHour - earliestHour) * 2 + Math.floor(currentMinute / 30);
    
    // Jeder Slot ist ca. 60px hoch (50px cell + 10px spacing schätzung)
    const SLOT_HEIGHT = 60;
    const HEADER_HEIGHT = 50; // Header mit Platznamen
    
    // Scroll-Position berechnen - zentriere die aktuelle Zeit wenn möglich
    const scrollPosition = Math.max(0, (slotsFromStart * SLOT_HEIGHT) - 150);
    
    console.log(`⏰ Auto-Scroll: Aktuelle Zeit ${currentHour}:${currentMinute}, scrolle zu Position ${scrollPosition}`);
    
    // ✅ WICHTIG: animated: false = Kein Scroll-Animation, direkt auf Position springen
    scrollViewRef.current.scrollTo({
      y: scrollPosition,
      animated: false
    });
    
    setShouldScrollToTime(false);
  };

  // ✅ Handler wenn ScrollView fertig gelayoutet ist
  const handleScrollViewLayout = () => {
    if (shouldScrollToTime) {
      // Kurzer Delay damit BookingCalendar auch fertig gerendert ist
      setTimeout(() => {
        scrollToCurrentTime();
      }, 100);
    }
  };

  const initializeScreen = async () => {
    try {
      console.log('🚀 ENTERPRISE: Initialisiere BookingScreen');
      
      // 1. ERST Permissions laden (verwendet jetzt lokale Daten)
      await loadUserPermissions();
      
      // 2. User-Daten direkt aus AsyncStorage laden (bereits beim Login gespeichert)
      const currentUserData = await AsyncStorage.getItem('currentUser');
      
      if (!currentUserData) {
        throw new Error('Session ungültig - bitte neu einloggen');
      }
      
      const userData = JSON.parse(currentUserData);
      console.log('� ENTERPRISE: User-Daten aus AsyncStorage:', userData);
      
      if (!userData.id || !userData.verein_id) {
        throw new Error('User-Daten unvollständig (ID oder Verein fehlt)');
      }
      
      // 3. IDs setzen
      setCurrentUserId(userData.id);
      setCurrentVereinId(userData.verein_id);
      
      // Zusätzlich für andere Komponenten speichern
      await AsyncStorage.setItem('userId', userData.id);
      await AsyncStorage.setItem('verein_id', userData.verein_id);
      
      console.log('✅ ENTERPRISE: IDs gesetzt - User:', userData.id, 'Verein:', userData.verein_id);
      
      // 4. DANN Courts laden
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

  // ✅ NAVIGATION FUNKTIONEN - Aus BookingCalendar hierher verschoben
  const formatDate = (date) => {
    return date.toLocaleDateString('de-DE', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 7);
    setSelectedDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 7);
    setSelectedDate(newDate);
  };

  // Court Navigation Funktionen
  const visibleCourts = courts.slice(courtStartIndex, courtStartIndex + COURTS_PER_VIEW);
  
  const goToPreviousCourts = () => {
    if (courtStartIndex > 0) {
      setCourtStartIndex(courtStartIndex - 1);
    }
  };

  const goToNextCourts = () => {
    if (courtStartIndex + COURTS_PER_VIEW < courts.length) {
      setCourtStartIndex(courtStartIndex + 1);
    }
  };

  const canShowPreviousCourts = courtStartIndex > 0;
  const canShowNextCourts = courtStartIndex + COURTS_PER_VIEW < courts.length;

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
      {/* ✅ FIXED NAVIGATION - Genau wie der rote Header, aber für Navigation */}
      <View style={styles.navigationHeader}>
        {/* Datums-Navigation */}
        <View style={styles.dateNavigationSection}>
          <Text style={styles.navigationTitle}>Buchungskalender</Text>
          <View style={styles.dateNavigation}>
            {/* WOCHENSPRUNG RÜCKWÄRTS */}
            <TouchableOpacity style={styles.weekNavButton} onPress={goToPreviousWeek}>
              <Text style={styles.weekNavButtonText}>←←</Text>
            </TouchableOpacity>
            {/* TAGESSPRUNG RÜCKWÄRTS */}
            <TouchableOpacity style={styles.navButton} onPress={goToPreviousDay}>
              <Text style={styles.navButtonText}>←</Text>
            </TouchableOpacity>
            {/* DATUM (HEUTE) */}
            <TouchableOpacity style={styles.dateContainer} onPress={goToToday}>
              <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
            </TouchableOpacity>
            {/* TAGESSPRUNG VORWÄRTS */}
            <TouchableOpacity style={styles.navButton} onPress={goToNextDay}>
              <Text style={styles.navButtonText}>→</Text>
            </TouchableOpacity>
            {/* WOCHENSPRUNG VORWÄRTS */}
            <TouchableOpacity style={styles.weekNavButton} onPress={goToNextWeek}>
              <Text style={styles.weekNavButtonText}>→→</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Plätze-Navigation */}
        {courts.length > COURTS_PER_VIEW && (
          <View style={styles.courtNavigation}>
            <TouchableOpacity 
              style={[styles.courtNavButton, !canShowPreviousCourts && styles.courtNavButtonDisabled]}
              onPress={goToPreviousCourts}
              disabled={!canShowPreviousCourts}
            >
              <Text style={styles.courtNavButtonText}>←</Text>
            </TouchableOpacity>
            
            <Text style={styles.courtNavInfo}>
              Plätze {courtStartIndex + 1}-{Math.min(courtStartIndex + COURTS_PER_VIEW, courts.length)} von {courts.length}
            </Text>
            
            <TouchableOpacity 
              style={[styles.courtNavButton, !canShowNextCourts && styles.courtNavButtonDisabled]}
              onPress={goToNextCourts}
              disabled={!canShowNextCourts}
            >
              <Text style={styles.courtNavButtonText}>→</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ✅ CONTENT - MIT ScrollView für korrekte Web-Scroll-Behandlung */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollableContent}
        showsVerticalScrollIndicator={false}
        onLayout={handleScrollViewLayout}
      >
        <BookingCalendar 
          courts={visibleCourts} 
          onBooking={handleBooking}
          canBookPublic={canBookPublic()}
          vereinId={currentVereinId}
          userId={currentUserId}  
          selectedDate={selectedDate} // ✅ Ausgewähltes Datum weiterleiten
        />
      </ScrollView>
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
  // ✅ FIXED NAVIGATION HEADER - Wie der rote Header, aber für Navigation  
  navigationHeader: {
    backgroundColor: '#fff',
    paddingTop: 45, // ✅ SafeArea-Kompatibel wie der rote Header
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateNavigationSection: {
    alignItems: 'center',
    marginBottom: 10,
  },
  navigationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  dateNavigation: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButton: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginHorizontal: 3,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  weekNavButton: {
    padding: 10,
    backgroundColor: '#DC143C',
    borderRadius: 8,
    marginHorizontal: 2,
    minWidth: 45,
  },
  weekNavButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  dateContainer: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    minWidth: 160,
  },
  courtNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginHorizontal: 5,
  },
  courtNavButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#2E8B57',
    borderRadius: 6,
  },
  courtNavButtonDisabled: {
    backgroundColor: '#ccc',
  },
  courtNavButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  courtNavInfo: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  // ✅ CONTENT CONTAINER
  contentContainer: {
    flex: 1,
  },
  // ✅ WEB-KOMPATIBLES SCROLLING - EXAKT wie SettingsScreen
  scrollableContent: {
    flex: 1,
    padding: 20,
    paddingBottom: 200,     // ✅ Mehr Platz für Bottom Tab Bar (von 100 auf 200 erhöht)
    height: '70vh',         // ✅ Feste Höhe für Web
    overflow: 'auto',       // ✅ Eigenes Scrolling
    maxHeight: '90vh',      // ✅ Max-Height Begrenzung
  },

});

export default BookingScreen;