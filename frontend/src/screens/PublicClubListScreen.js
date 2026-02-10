import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Linking,
  ScrollView,
} from 'react-native';

const PublicClubListScreen = ({ navigation }) => {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClubs();
  }, []);

  const loadClubs = async () => {
    try {
      setLoading(true);
      console.log('🏢 Lade öffentliche Vereinsliste...');
      
      // API-Call zu deinem Lambda Backend
      const url = 'https://crfdc7s6frt3rvczcg7l7xmddq0gjnxr.lambda-url.eu-central-1.on.aws/api/clubs';
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📊 Vereins-API Response:', data);
      
      // Abhängig von der Backend-Struktur
      const clubsList = data.clubs || data || [];
      
      if (Array.isArray(clubsList)) {
        setClubs(clubsList);
        console.log(`✅ ${clubsList.length} Vereine geladen`);
      } else {
        console.warn('⚠️ Unerwartetes Datenformat:', data);
        setClubs([]);
      }
      
    } catch (error) {
      console.error('❌ Fehler beim Laden der Vereine:', error);
      Alert.alert(
        'Fehler', 
        'Vereine konnten nicht geladen werden. Bitte versuchen Sie es später erneut.',
        [
          { text: 'OK' },
          { text: 'Zurück', onPress: () => navigation.goBack() }
        ]
      );
      setClubs([]);
    } finally {
      setLoading(false);
    }
  };

  const openClubInfo = (club) => {
    console.log(`🔍 Öffne Vereinsinfo für: ${club.name} (ID: ${club.id})`);
    
    // Navigation zur PublicInfoScreen mit Verein-ID
    navigation.navigate('PublicInfo', { 
      clubId: club.id,
      clubName: club.name,
      // Generiere eine öffentliche URL für Sharing
      publicUrl: generatePublicUrl(club.id)
    });
  };

  const generatePublicUrl = (clubId) => {
    // Diese URL können Vereine auf ihre Website einbinden
    // In einer echten App wäre das eine Deep-Link URL
    return `https://jkb-grounds.app/public/club/${clubId}`;
  };

  const shareClubLink = async (club) => {
    const publicUrl = generatePublicUrl(club.id);
    
    try {
      // In einer echten App würde man hier den Share-Dialog öffnen
      // Für jetzt zeigen wir die URL in einem Alert
      Alert.alert(
        'Öffentlicher Link',
        `Link für ${club.name}:\n\n${publicUrl}`,
        [
          { text: 'Kopieren', onPress: () => {
            // In React Native würde man Clipboard verwenden
            console.log('📋 Link kopiert:', publicUrl);
          }},
          { text: 'Schließen' }
        ]
      );
    } catch (error) {
      console.error('Fehler beim Teilen:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DC143C" />
          <Text style={styles.loadingText}>Lade Vereine...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Zurück</Text>
        </TouchableOpacity>
        
        <Text style={styles.title}>Vereinsinfos</Text>
        <Text style={styles.subtitle}>
          Wählen Sie einen Verein um die aktuelle Platzbelegung anzusehen
        </Text>
      </View>

      {/* ✅ SCROLLVIEW für korrekte Web-Scroll-Behandlung */}
      <ScrollView 
        style={styles.scrollableContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.listContainer}>
          {clubs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Keine Vereine gefunden</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadClubs}>
                <Text style={styles.retryButtonText}>Erneut versuchen</Text>
              </TouchableOpacity>
            </View>
          ) : (
            clubs.map((item, index) => (
              <View key={item.id?.toString() || index} style={styles.clubCard}>
                <TouchableOpacity 
                  style={styles.clubButton}
                  onPress={() => openClubInfo(item)}
                >
                  <View style={styles.clubHeader}>
                    <Text style={styles.clubName}>{item.name}</Text>
                    <Text style={styles.clubInfo}>Plätze: {item.anzahl_plaetze || 'N/A'}</Text>
                  </View>
                  
                  {item.beschreibung && (
                    <Text style={styles.clubDescription} numberOfLines={2}>
                      {item.beschreibung}
                    </Text>
                  )}
                  
                  <View style={styles.clubActions}>
                    <Text style={styles.viewInfoText}>Platzbelegung ansehen</Text>
                    <TouchableOpacity 
                      style={styles.shareButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        shareClubLink(item);
                      }}
                    >
                      <Text style={styles.shareButtonText}>Link</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
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
  scrollableContent: {
    flex: 1,
    padding: 20,
    paddingBottom: 200,     // ✅ Mehr Platz für Bottom Tab Bar 
    height: '70vh',         // ✅ Feste Höhe für Web
    overflow: 'auto',       // ✅ Eigenes Scrolling
    maxHeight: '90vh',      // ✅ Max-Height Begrenzung
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#DC143C',
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#DC143C',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
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
  listContainer: {
    // Entfernt padding da ScrollView bereits padding hat
  },
  clubCard: {
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clubButton: {
    padding: 20,
  },
  clubHeader: {
    marginBottom: 10,
  },
  clubName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  clubInfo: {
    fontSize: 14,
    color: '#666',
  },
  clubDescription: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
    marginBottom: 15,
  },
  clubActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewInfoText: {
    fontSize: 16,
    color: '#DC143C',
    fontWeight: '600',
  },
  shareButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  shareButtonText: {
    fontSize: 18,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#DC143C',
    padding: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PublicClubListScreen;
