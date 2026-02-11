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
  SafeAreaView,
  Share,
} from 'react-native';
import BookingCalendar from '../components/BookingCalender';

const PublicInfoScreen = ({ navigation, route }) => {
  // URL-Parameter handling: /jkbtestverein oder navigation params
  const clubSlug = route.params?.clubSlug;
  const clubId = route.params?.clubId;
  const clubName = route.params?.clubName;
  const publicUrl = route.params?.publicUrl;
  
  // Club-Info laden basierend auf Slug oder ID
  const [actualClubId, setActualClubId] = useState(clubId);
  const [actualClubName, setActualClubName] = useState(clubName);
  
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clubInfo, setClubInfo] = useState(null);
  
  // ✅ DATUMS-NAVIGATION - Gleich wie BookingScreen
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [courtStartIndex, setCourtStartIndex] = useState(0);
  
  // ✅ CONSTANTS
  const COURTS_PER_VIEW = 3;

  useEffect(() => {
    initializePublicView();
  }, [actualClubId]);

  // Neue Funktion: Club-Info per Slug laden
  const loadClubBySlug = async (slug) => {
    try {
      console.log(`🔍 Suche Club mit Slug: ${slug}`);
      
      // Lade alle Clubs und finde den passenden Slug
      const response = await fetch('https://crfdc7s6frt3rvczcg7l7xmddq0gjnxr.lambda-url.eu-central-1.on.aws/api/clubs');
      const data = await response.json();
      const clubs = data.clubs || data || [];
      
      // Finde Club basierend auf Slug (vereinfacht: slug = name in lowercase)
      const club = clubs.find(c => 
        c.name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '') === slug ||
        c.id === slug
      );
      
      if (club) {
        setActualClubId(club.id);
        setActualClubName(club.name);
        console.log(`✅ Club gefunden: ${club.name} (${club.id})`);
        return club;
      } else {
        throw new Error(`Club mit Slug "${slug}" nicht gefunden`);
      }
      
    } catch (error) {
      console.error('❌ Fehler beim Laden des Clubs per Slug:', error);
      Alert.alert(
        'Verein nicht gefunden',
        `Der Verein "${slug}" konnte nicht gefunden werden.`,
        [{ text: 'OK', onPress: () => navigation.navigate('PublicClubList') }]
      );
      throw error;
    }
  };

  const initializePublicView = async () => {
    try {
      setLoading(true);
      
      // Falls wir einen Slug haben, erst Club-Info laden
      if (clubSlug && !actualClubId) {
        await loadClubBySlug(clubSlug);
        return; // useEffect wird erneut ausgeführt mit actualClubId
      }
      
      if (!actualClubId) {
        throw new Error('Keine Club-ID verfügbar');
      }
      
      console.log(`🌐 PUBLIC: Initialisiere öffentliche Ansicht für Verein ${actualClubId}`);
      
      // Parallel beide Datenquellen laden
      await Promise.all([
        loadClubInfo(),
        loadCourts()
      ]);
      
      console.log('✅ PUBLIC: Öffentliche Ansicht erfolgreich geladen');
      
    } catch (error) {
      console.error('❌ PUBLIC: Fehler beim Laden:', error);
      Alert.alert(
        'Fehler',
        'Vereinsinformationen konnten nicht geladen werden',
        [
          { text: 'Erneut versuchen', onPress: initializePublicView },
          { text: 'Zurück', onPress: () => navigation.goBack() }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const loadClubInfo = async () => {
    try {
      console.log(`📋 PUBLIC: Lade Vereinsinfos für ${actualClubId}`);
      
      // Falls du einen separaten Endpoint für Vereinsdetails hast
      const url = `https://crfdc7s6frt3rvczcg7l7xmddq0gjnxr.lambda-url.eu-central-1.on.aws/api/clubs/${actualClubId}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        setClubInfo(data);
        console.log('✅ Vereinsinfos geladen:', data.name);
      } else {
        // Fallback: Nur den Namen aus den Route-Params verwenden
        setClubInfo({ name: clubName, id: clubId });
      }
      
    } catch (error) {
      console.warn('⚠️ Vereinsinfos nicht verfügbar, verwende Fallback');
      setClubInfo({ name: clubName, id: clubId });
    }
  };

  const loadCourts = async () => {
    try {
      setLoading(true);
      console.log(`🏟️ PUBLIC: Lade Plätze für Verein ${clubId}`);
      
      const url = `https://crfdc7s6frt3rvczcg7l7xmddq0gjnxr.lambda-url.eu-central-1.on.aws/api/courts/verein/${clubId}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📊 PUBLIC Courts Response:', data);
      
      const courtsList = Array.isArray(data) ? data : (data.courts || []);
      
      if (courtsList.length > 0) {
        setCourts(courtsList);
        console.log(`✅ PUBLIC: ${courtsList.length} Plätze geladen`);
      } else {
        console.warn('⚠️ Keine Plätze gefunden');
        setCourts([]);
      }
      
    } catch (error) {
      console.error('❌ PUBLIC: Fehler beim Laden der Plätze:', error);
      throw error; // Wird vom initializePublicView abgefangen
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await initializePublicView();
    setRefreshing(false);
  };

  const shareClub = async () => {
    try {
      const message = `Schauen Sie sich die aktuellen Platzbelegungen von ${clubInfo?.name || clubName} an: ${publicUrl}`;
      
      await Share.share({
        message: message,
        url: publicUrl, // iOS
        title: `${clubInfo?.name || clubName} - Platzbelegung`
      });
    } catch (error) {
      console.error('Fehler beim Teilen:', error);
    }
  };

  // ✅ DATUMS-NAVIGATION FUNKTIONEN - Gleich wie BookingScreen
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

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // ✅ PLATZ-NAVIGATION FUNKTIONEN
  const navigateCourts = (direction) => {
    if (direction === 'prev' && courtStartIndex > 0) {
      setCourtStartIndex(courtStartIndex - COURTS_PER_VIEW);
    } else if (direction === 'next' && courtStartIndex + COURTS_PER_VIEW < courts.length) {
      setCourtStartIndex(courtStartIndex + COURTS_PER_VIEW);
    }
  };

  // ✅ PLATZ-NAVIGATION VARIABLEN
  const visibleCourts = courts.slice(courtStartIndex, courtStartIndex + COURTS_PER_VIEW);
  const hasMoreCourts = courts.length > COURTS_PER_VIEW;
  const canNavigatePrev = courtStartIndex > 0;
  const canNavigateNext = courtStartIndex + COURTS_PER_VIEW < courts.length;

  if (loading && courts.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DC143C" />
          <Text style={styles.loadingText}>Lade Vereinsinformationen...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Zurück</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.shareButton}
            onPress={shareClub}
          >
            <Text style={styles.shareButtonText}>Teilen</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.title}>{clubInfo?.name || clubName}</Text>
        <Text style={styles.subtitle}>Aktuelle Platzbelegung (nur Ansicht)</Text>
        
        {clubInfo?.beschreibung && (
          <Text style={styles.description}>{clubInfo.beschreibung}</Text>
        )}
        
        <View style={styles.infoNote}>
          <Text style={styles.infoNoteText}>
            Dies ist eine öffentliche Ansicht. Zum Buchen melden Sie sich bitte an.
          </Text>
        </View>
      </View>

      {/* ✅ DATUMS-NAVIGATION */}
      <View style={styles.navigationHeader}>
        <View style={styles.dateNavigationSection}>
          <Text style={styles.navigationTitle}>Datum auswählen</Text>
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
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#DC143C']}
          />
        }
      >
        {courts.length === 0 ? (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>Keine Plätze verfügbar</Text>
            <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
              <Text style={styles.retryButtonText}>Erneut laden</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Platz-Navigation */}
            {hasMoreCourts && (
              <View style={styles.courtNavigation}>
                <TouchableOpacity
                  style={[styles.navButton, !canNavigatePrev && styles.navButtonDisabled]}
                  onPress={() => navigateCourts('prev')}
                  disabled={!canNavigatePrev}
                >
                  <Text style={[styles.navButtonText, !canNavigatePrev && styles.navButtonTextDisabled]}>
                    ← Zurück
                  </Text>
                </TouchableOpacity>

                <Text style={styles.courtCounter}>
                  Plätze {courtStartIndex + 1}-{Math.min(courtStartIndex + COURTS_PER_VIEW, courts.length)} von {courts.length}
                </Text>

                <TouchableOpacity
                  style={[styles.navButton, !canNavigateNext && styles.navButtonDisabled]}
                  onPress={() => navigateCourts('next')}
                  disabled={!canNavigateNext}
                >
                  <Text style={[styles.navButtonText, !canNavigateNext && styles.navButtonTextDisabled]}>
                    Weiter →
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Booking Calendar - PUBLIC MODE */}
            <BookingCalendar
              courts={visibleCourts}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              vereinId={clubId} // ✅ WICHTIG: Club ID als vereinId weitergeben
              isPublicView={true} // ⭐ WICHTIG: Public-Mode Flag
              clubName={clubInfo?.name || clubName}
              refreshTrigger={refreshing}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 16,
    color: '#DC143C',
    fontWeight: '600',
  },
  shareButton: {
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  shareButtonText: {
    fontSize: 14,
    color: '#DC143C',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#DC143C',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 15,
  },
  infoNote: {
    backgroundColor: '#e8f4ff',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoNoteText: {
    fontSize: 14,
    color: '#1976D2',
    textAlign: 'center',
  },
  // ✅ DATUMS-NAVIGATION STYLES - Gleich wie BookingScreen
  navigationHeader: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  dateNavigationSection: {
    alignItems: 'center',
  },
  navigationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButton: {
    backgroundColor: '#DC143C',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginHorizontal: 5,
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  weekNavButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    marginHorizontal: 3,
  },
  weekNavButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  dateContainer: {
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingBottom: 200,     // ✅ Mehr Platz für Bottom Tab Bar
    height: '70vh',         // ✅ Feste Höhe für Web
    overflow: 'auto',       // ✅ Eigenes Scrolling
    maxHeight: '90vh',      // ✅ Max-Height Begrenzung
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noDataText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#DC143C',
    padding: 15,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  courtNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  navButton: {
    backgroundColor: '#DC143C',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
  },
  navButtonDisabled: {
    backgroundColor: '#ccc',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  navButtonTextDisabled: {
    color: '#999',
  },
  courtCounter: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
});

export default PublicInfoScreen;