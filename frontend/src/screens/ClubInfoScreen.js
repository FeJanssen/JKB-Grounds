import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import ApiService from '../services/api';

const ClubInfoScreen = ({ route, navigation }) => {
  const { club } = route.params;
  const [clubDetails, setClubDetails] = useState(null);
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClubDetails();
  }, []);

  const loadClubDetails = async () => {
    setLoading(true);
    try {
      // Load detailed club information and courts
      const [clubResponse, courtsResponse] = await Promise.all([
        ApiService.getClubDetails(club.verein_id),
        ApiService.getClubCourts(club.verein_id)
      ]);

      setClubDetails(clubResponse);
      setCourts(courtsResponse || []);
    } catch (error) {
      console.error('Fehler beim Laden der Vereinsdetails:', error);
      Alert.alert('Fehler', 'Vereinsdetails konnten nicht geladen werden');
      // Fall back to basic club info from route params
      setClubDetails(club);
    } finally {
      setLoading(false);
    }
  };

  const handlePhonePress = (phone) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const handleEmailPress = (email) => {
    if (email) {
      Linking.openURL(`mailto:${email}`);
    }
  };

  const handleWebsitePress = (website) => {
    if (website) {
      let url = website;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      Linking.openURL(url);
    }
  };

  const renderCourtInfo = (court, index) => (
    <View key={index} style={styles.courtItem}>
      <View style={styles.courtHeader}>
        <Text style={styles.courtName}>{court.platzname}</Text>
        <Text style={styles.courtType}>{court.belag}</Text>
      </View>
      <View style={styles.courtDetails}>
        <Text style={styles.courtDetailText}>
          Status: {court.status === 'aktiv' ? '✅ Aktiv' : '❌ Inaktiv'}
        </Text>
        {court.bemerkungen && (
          <Text style={styles.courtDetailText}>
            Bemerkungen: {court.bemerkungen}
          </Text>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DC143C" />
        <Text style={styles.loadingText}>Lade Vereinsdetails...</Text>
      </View>
    );
  }

  const displayClub = clubDetails || club;

  return (
    <View style={styles.container}>
      {/* ✅ HEADER - FIXED wie im BookingScreen */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Zurück</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {displayClub.vereinsname}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* ✅ CONTENT - MIT ScrollView für korrekte Web-Scroll-Behandlung */}
      <ScrollView 
        style={styles.scrollableContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Club Information */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Vereinsinformationen</Text>
          
          <View style={styles.infoCard}>
            <Text style={styles.clubName}>{displayClub.vereinsname}</Text>
            
            {displayClub.adresse && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>📍 Adresse:</Text>
                <Text style={styles.infoValue}>{displayClub.adresse}</Text>
              </View>
            )}
            
            {displayClub.telefon && (
              <TouchableOpacity 
                style={styles.infoRow}
                onPress={() => handlePhonePress(displayClub.telefon)}
              >
                <Text style={styles.infoLabel}>📞 Telefon:</Text>
                <Text style={[styles.infoValue, styles.linkText]}>
                  {displayClub.telefon}
                </Text>
              </TouchableOpacity>
            )}
            
            {displayClub.email && (
              <TouchableOpacity 
                style={styles.infoRow}
                onPress={() => handleEmailPress(displayClub.email)}
              >
                <Text style={styles.infoLabel}>📧 E-Mail:</Text>
                <Text style={[styles.infoValue, styles.linkText]}>
                  {displayClub.email}
                </Text>
              </TouchableOpacity>
            )}
            
            {displayClub.website && (
              <TouchableOpacity 
                style={styles.infoRow}
                onPress={() => handleWebsitePress(displayClub.website)}
              >
                <Text style={styles.infoLabel}>🌐 Website:</Text>
                <Text style={[styles.infoValue, styles.linkText]}>
                  {displayClub.website}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Courts Information */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>
            Tennisplätze ({courts.length})
          </Text>
          
          {courts.length > 0 ? (
            <View style={styles.courtsContainer}>
              {courts.map((court, index) => renderCourtInfo(court, index))}
            </View>
          ) : (
            <View style={styles.noCourtsCard}>
              <Text style={styles.noCourtsText}>
                Keine Plätze verfügbar
              </Text>
            </View>
          )}
        </View>

        {/* Additional Info */}
        {displayClub.beschreibung && (
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Beschreibung</Text>
            <View style={styles.infoCard}>
              <Text style={styles.descriptionText}>
                {displayClub.beschreibung}
              </Text>
            </View>
          </View>
        )}

        {/* Spacer for bottom padding */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#DC143C',
    padding: 20,
    paddingTop: 50,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginHorizontal: 10,
  },
  placeholder: {
    minWidth: 80,
  },
  scrollableContent: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  infoSection: {
    margin: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DC143C',
    marginBottom: 10,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  clubName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#DC143C',
    marginBottom: 15,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    width: 100,
    flexShrink: 0,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    marginLeft: 10,
  },
  linkText: {
    color: '#DC143C',
    textDecorationLine: 'underline',
  },
  courtsContainer: {
    gap: 10,
  },
  courtItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  courtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  courtName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DC143C',
    flex: 1,
  },
  courtType: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 15,
  },
  courtDetails: {
    gap: 5,
  },
  courtDetailText: {
    fontSize: 14,
    color: '#666',
  },
  noCourtsCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  noCourtsText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  descriptionText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  bottomSpacer: {
    height: 20,
  },
});

export default ClubInfoScreen;
