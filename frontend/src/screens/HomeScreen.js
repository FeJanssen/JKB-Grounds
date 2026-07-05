import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const HomeScreen = ({ changeTab }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    availableNow: 0,
    totalCourts: 0,
    todayBookings: []
  });
  const [vereinId, setVereinId] = useState(null);

  useEffect(() => {
    initializeHomeScreen();
    
    // Aktualisiere alle 30 Sekunden
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const initializeHomeScreen = async () => {
    try {
      // Lade Verein-ID aus AsyncStorage
      const storedVereinId = await AsyncStorage.getItem('verein_id');
      if (!storedVereinId) {
        throw new Error('Keine Verein-ID gefunden - bitte neu anmelden');
      }
      
      setVereinId(storedVereinId);
      console.log('🏠 HomeScreen: Verein-ID geladen:', storedVereinId);
      
      // Lade Dashboard-Daten für diese Verein-ID
      await loadDashboardData(storedVereinId);
      
    } catch (error) {
      console.error('❌ HomeScreen Initialisierung fehlgeschlagen:', error);
      Alert.alert('Verein-ID fehlt', 'Bitte melden Sie sich neu an um die Verein-ID zu laden.');
    }
  };

  const loadDashboardData = async (currentVereinId = null) => {
    try {
      const useVereinId = currentVereinId || vereinId;
      if (!useVereinId) {
        console.log('⚠️ Keine Verein-ID verfügbar, überspringe Dashboard-Laden');
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      console.log('🔄 Lade Dashboard-Daten für:', today, 'Verein:', useVereinId);
      
      // Parallel laden: Heutige Buchungen und alle Plätze für den Verein
      const [todayBookingsRes, courtsRes] = await Promise.all([
        fetch(`https://crfdc7s6frt3rvczcg7l7xmddq0gjnxr.lambda-url.eu-central-1.on.aws/api/bookings/date/${today}?verein_id=${useVereinId}`),
        fetch(`https://crfdc7s6frt3rvczcg7l7xmddq0gjnxr.lambda-url.eu-central-1.on.aws/api/courts/verein/${useVereinId}`)
      ]);

      const todayBookings = todayBookingsRes.ok ? await todayBookingsRes.json() : { bookings: [] };
      const courtsResponse = courtsRes.ok ? await courtsRes.json() : { courts: [] };
      
      // Handle verschiedene API-Response-Formate
      const courts = courtsResponse.courts || courtsResponse.data || [];

      console.log('📊 Dashboard geladen:', {
        buchungen: todayBookings.bookings?.length || 0,
        plätze: courts.length || 0
      });

      // Berechne verfügbare Plätze jetzt
      const availableNow = calculateAvailableNow(courts || [], todayBookings.bookings || []);

      setDashboardData({
        availableNow: availableNow,
        totalCourts: courts.length || 0,
        todayBookings: todayBookings.bookings || []
      });

    } catch (error) {
      console.error('❌ Fehler beim Laden der Dashboard-Daten:', error);
      Alert.alert(
        'Verbindungsfehler',
        'Dashboard-Daten konnten nicht geladen werden.',
        [
          { text: 'Nochmal versuchen', onPress: () => loadDashboardData() },
          { text: 'OK', style: 'cancel' }
        ]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateAvailableNow = (courts, todayBookings) => {
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    
    // Runde auf nächste 30-Minuten-Marke
    const roundedMinute = Math.floor(currentMinute / 30) * 30;
    const currentTimeSlot = `${currentHour.toString().padStart(2, '0')}:${roundedMinute.toString().padStart(2, '0')}`;
    
    console.log('Prüfe Verfügbarkeit für Zeitslot:', currentTimeSlot);
    
    // Filtere verfügbare Plätze
    const availableCourts = courts.filter(court => {
      const isBooked = todayBookings.some(booking => {
        if (booking.platz_id !== court.id) return false;
        
        const startTime = booking.uhrzeit_von.substring(0, 5);
        const endTime = booking.uhrzeit_bis.substring(0, 5);
        
        return startTime <= currentTimeSlot && endTime > currentTimeSlot;
      });
      
      return !isBooked;
    });
    
    console.log('Verfügbare Plätze jetzt:', availableCourts.length);
    return availableCourts.length;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
  };

  const getTodayDate = () => {
    return new Date().toLocaleDateString('de-DE', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('de-DE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>JKB Grounds</Text>
          <Text style={styles.subtitle}>{getTodayDate()}</Text>
        </View>
        
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#4A4A4A" />
          <Text style={{ marginTop: 16, fontSize: 16, color: '#4A4A4A', fontWeight: '600' }}>
            Lade Dashboard-Daten...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>JKB Grounds</Text>
        <Text style={styles.subtitle}>{getTodayDate()}</Text>
      </View>

      {/* CONTENT BEREICH */}
      <ScrollView 
        style={styles.contentArea} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        
        {/* STATISTIK KÄSTEN - ECHTE DATEN */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{dashboardData.availableNow}</Text>
            <Text style={styles.statLabel}>Plätze frei</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{dashboardData.totalCourts}</Text>
            <Text style={styles.statLabel}>Plätze gesamt</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{getCurrentTime()}</Text>
            <Text style={styles.statLabel}>Uhrzeit</Text>
          </View>
        </View>

        {/* SCHNELLZUGRIFF */}
        <View style={styles.quickAccessSection}>
          <Text style={styles.sectionTitle}>Schnellzugriff</Text>
          
          <TouchableOpacity 
            style={styles.quickAccessCard}
            onPress={() => {
              if (changeTab) {
                changeTab('Booking');
              }
            }}
          >
            <View style={styles.quickAccessContent}>
              <Ionicons name="tennisball" size={32} color="#007AFF" style={styles.quickAccessIcon} />
              <View style={styles.quickAccessText}>
                <Text style={styles.quickAccessTitle}>Platz buchen</Text>
                <Text style={styles.quickAccessSubtitle}>
                  {dashboardData.availableNow > 0 
                    ? `${dashboardData.availableNow} Plätze jetzt verfügbar`
                    : 'Andere Zeiten prüfen'
                  }
                </Text>
              </View>
            </View>
            <Text style={styles.quickAccessArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickAccessCard}
            onPress={() => {
              if (changeTab) {
                changeTab('Settings');
              }
            }}
          >
            <View style={styles.quickAccessContent}>
              <Ionicons name="calendar-outline" size={32} color="#007AFF" style={styles.quickAccessIcon} />
              <View style={styles.quickAccessText}>
                <Text style={styles.quickAccessTitle}>Termine verwalten</Text>
                <Text style={styles.quickAccessSubtitle}>Buchungen ansehen und stornieren</Text>
              </View>
            </View>
            <Text style={styles.quickAccessArrow}>→</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4A4A4A',
    padding: 20,
    paddingTop: 10,
    paddingBottom: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 5,
  },
  contentArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Platz für Bottom Tab Bar
  },
  
  // STATISTIK KÄSTEN
  statsContainer: {
    flexDirection: 'row',
    margin: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4A4A4A',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },

  // SCHNELLZUGRIFF
  quickAccessSection: {
    margin: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  quickAccessCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  quickAccessContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickAccessIcon: {
    marginRight: 15,
    alignSelf: 'center',
  },
  quickAccessText: {
    flex: 1,
  },
  quickAccessTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#4A4A4A',
  },
  quickAccessSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 3,
  },
  quickAccessArrow: {
    fontSize: 20,
    color: '#4A4A4A',
    fontWeight: 'bold',
  },
});

export default HomeScreen;