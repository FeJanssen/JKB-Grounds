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
import { useUser } from '../context/UserContext';

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
        Alert.alert('Fehler', 'Keine Benutzer-ID verfügbar. Bitte melde dich erneut an.');
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
      const response = await fetch(`https://jkb-grounds-production.up.railway.app/api/users/${userId}`);
      
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
      
      const response = await fetch(`https://jkb-grounds-production.up.railway.app/api/users/${userId}/bookings?from_date=${today}`);
      
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
    Alert.alert(
      'Buchung stornieren',
      `Möchten Sie die Buchung für ${booking.platz?.name} am ${formatDate(booking.datum)} um ${booking.uhrzeit_von.substring(0, 5)} Uhr wirklich stornieren?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Stornieren',
          style: 'destructive',
          onPress: () => confirmCancelBooking(booking.id)
        }
      ]
    );
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
        Alert.alert('Fehler', 'Keine Benutzer-ID verfügbar. Bitte melde dich erneut an.');
        return;
      }
      
      console.log('👤 Verwende User-ID für Stornierung:', userId);
      
      const response = await fetch(`https://jkb-grounds-production.up.railway.app/api/bookings/${bookingId}`, {
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
        Alert.alert('Erfolg', 'Buchung wurde erfolgreich storniert.');
        
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
          Alert.alert('Fehler', 'Buchung wurde nicht gefunden.');
        } else if (response.status === 401) {
          Alert.alert('Fehler', 'Authentifizierung fehlgeschlagen. Bitte melde dich erneut an.');
        } else if (response.status === 403) {
          Alert.alert('Fehler', 'Sie haben keine Berechtigung, diese Buchung zu stornieren.');
        } else if (response.status === 400) {
          Alert.alert('Fehler', 'Buchung kann nicht storniert werden (möglicherweise zu spät).');
        } else {
          Alert.alert('Fehler', `Buchung konnte nicht storniert werden (${response.status}). Bitte versuchen Sie es später erneut.`);
        }
      }
    } catch (error) {
      console.error('❌ Exception beim Stornieren:', error);
      Alert.alert('Fehler', 'Verbindungsfehler beim Stornieren. Bitte überprüfen Sie Ihre Internetverbindung.');
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
        Alert.alert('Keine Änderungen', 'Es wurden keine Änderungen vorgenommen.');
        setEditModalVisible(false);
        return;
      }

      console.log('Sende Update:', updateData);

      const response = await fetch(`https://jkb-grounds-production.up.railway.app/api/users/${userId}`, {
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
        Alert.alert('Erfolg', 'Profil wurde aktualisiert.');
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
            Alert.alert('Abgemeldet', 'Sie wurden erfolgreich abgemeldet.');
          }
        }
      ]
    );
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
        <ActivityIndicator size="large" color="#2E8B57" />
        <Text style={styles.loadingText}>Lade Einstellungen...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ✅ FIXED HEADER wie im CRM */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⚙️ Einstellungen</Text>
      </View>

      {/* ✅ SCROLLABLE CONTENT mit fester Height wie im CRM */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={['#2E8B57']}
          />
        }
      >
        {/* Buchungen Sektion */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Meine Buchungen ({userBookings.length})</Text>
          
          {userBookings.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Keine zukünftigen Buchungen</Text>
              <TouchableOpacity 
                style={styles.bookNowButton}
                onPress={() => changeTab && changeTab('Booking')}
              >
                <Text style={styles.bookNowText}>Jetzt buchen</Text>
              </TouchableOpacity>
            </View>
          ) : (
            userBookings.map((booking) => (
              <View key={booking.id} style={styles.bookingCard}>
                <View style={styles.bookingInfo}>
                  <Text style={styles.bookingTitle}>
                    🎾 {booking.platz?.name || 'Platz ' + booking.platz_id}
                  </Text>
                  <Text style={styles.bookingDate}>
                    📅 {formatDate(booking.datum)}
                  </Text>
                  <Text style={styles.bookingTime}>
                    🕐 {formatBookingTime(booking)}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => cancelBooking(booking)}
                >
                  <Text style={styles.cancelButtonText}>Stornieren</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Profil Sektion */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Mein Profil</Text>
          
          <View style={styles.profileCard}>
            <TouchableOpacity 
              style={styles.profileRow}
              onPress={() => startEditProfile('name')}
            >
              <Text style={styles.profileLabel}>Name</Text>
              <View style={styles.profileValueContainer}>
                <Text style={styles.profileValue}>{userProfile.name || 'Nicht angegeben'}</Text>
                <Text style={styles.editIcon}>✏️</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.profileRow}
              onPress={() => startEditProfile('email')}
            >
              <Text style={styles.profileLabel}>E-Mail</Text>
              <View style={styles.profileValueContainer}>
                <Text style={styles.profileValue}>{userProfile.email || 'Nicht angegeben'}</Text>
                <Text style={styles.editIcon}>✏️</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.profileRow}
              onPress={() => startEditProfile('geschlecht')}
            >
              <Text style={styles.profileLabel}>Geschlecht</Text>
              <View style={styles.profileValueContainer}>
                <Text style={styles.profileValue}>{userProfile.geschlecht || 'Nicht angegeben'}</Text>
                <Text style={styles.editIcon}>✏️</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.profileRow}
              onPress={() => startEditProfile('password')}
            >
              <Text style={styles.profileLabel}>Passwort</Text>
              <View style={styles.profileValueContainer}>
                <Text style={styles.profileValue}>••••••••</Text>
                <Text style={styles.editIcon}>✏️</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>🚪 Abmelden</Text>
          </TouchableOpacity>
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
    backgroundColor: '#000',
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
  // ✅ SCROLLABLE CONTENT mit fester Height wie im CRM
  content: {
    flex: 1,
    padding: 20,
    paddingBottom: 100,     // ✅ Platz für Bottom Tab Bar
    height: '70vh',         // ✅ Feste Höhe für Web
    overflow: 'auto',       // ✅ Eigenes Scrolling
    maxHeight: '90vh',      // ✅ Max-Height Begrenzung
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  bookingCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E8B57',
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
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
    backgroundColor: '#2E8B57',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
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
    backgroundColor: '#ff4444',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
    borderColor: '#2E8B57',
    backgroundColor: '#e8f5e8',
  },
  genderOptionText: {
    fontSize: 16,
    color: '#666',
  },
  genderOptionTextSelected: {
    color: '#2E8B57',
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
    backgroundColor: '#2E8B57',
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
});

export default SettingsScreen;