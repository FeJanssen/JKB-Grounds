import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import ApiService from '../services/api';

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    vereinsname: '',
    geschlecht: ''
  });
  const [loading, setLoading] = useState(false);
  const [clubs, setClubs] = useState([]);
  const [loadingClubs, setLoadingClubs] = useState(false);
  const [showClubDropdown, setShowClubDropdown] = useState(false);
  const [clubSearchText, setClubSearchText] = useState('');
  const [filteredClubs, setFilteredClubs] = useState([]);

  const updateField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Lade Vereine beim Start
  useEffect(() => {
    loadClubs();
  }, []);

  const loadClubs = async () => {
    setLoadingClubs(true);
    try {
      const response = await fetch('https://crfdc7s6frt3rvczcg7l7xmddq0gjnxr.lambda-url.eu-central-1.on.aws/api/clubs/list');
      const data = await response.json();
      setClubs(data.clubs || []);
      setFilteredClubs(data.clubs || []);
    } catch (error) {
      console.error('Fehler beim Laden der Vereine:', error);
      Alert.alert('Fehler', 'Vereine konnten nicht geladen werden');
    } finally {
      setLoadingClubs(false);
    }
  };

  // Filtere Vereine basierend auf Suchtext
  const filterClubs = (searchText) => {
    setClubSearchText(searchText);
    if (searchText.length === 0) {
      setFilteredClubs(clubs);
    } else {
      const filtered = clubs.filter(club =>
        club.name.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredClubs(filtered);
    }
  };

  const selectClub = (club) => {
    updateField('vereinsname', club.name);
    setShowClubDropdown(false);
    setClubSearchText(club.name);
  };

  const openClubDropdown = () => {
    setClubSearchText(formData.vereinsname);
    filterClubs(formData.vereinsname);
    setShowClubDropdown(true);
  };

  const handleRegister = async () => {
    // Validierung
    if (!formData.name || !formData.email || !formData.password || !formData.vereinsname) {
      Alert.alert('Fehler', 'Bitte alle Pflichtfelder ausfüllen');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Fehler', 'Passwörter stimmen nicht überein');
      return;
    }

    if (formData.password.length < 3) {
      Alert.alert('Fehler', 'Passwort muss mindestens 3 Zeichen lang sein');
      return;
    }

    // Prüfe ob der ausgewählte Verein existiert
    const selectedClub = clubs.find(club => club.name === formData.vereinsname);
    if (!selectedClub) {
      Alert.alert('Fehler', 'Bitte wählen Sie einen gültigen Verein aus der Liste');
      return;
    }

    setLoading(true);
    try {
      const registerData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        vereinsname: formData.vereinsname.trim(),
        geschlecht: formData.geschlecht || null
      };

      const response = await ApiService.register(registerData);

      Alert.alert(
        'Registrierung erfolgreich',
        `Willkommen ${response.user.name}! Ihr Account wartet auf Admin-Freigabe.`,
        [
          {
            text: 'Zum Login',
            onPress: () => navigation.navigate('Login')
          }
        ]
      );
      
    } catch (error) {
      Alert.alert('Registrierung Fehler', error.message);
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Registrierung</Text>
        <Text style={styles.subtitle}>JKB Grounds Tennis</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Name *"
          value={formData.name}
          onChangeText={(value) => updateField('name', value)}
          autoCorrect={false}
        />

        <TextInput
          style={styles.input}
          placeholder="Email *"
          value={formData.email}
          onChangeText={(value) => updateField('email', value)}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          style={styles.input}
          placeholder="Passwort *"
          value={formData.password}
          onChangeText={(value) => updateField('password', value)}
          secureTextEntry
        />

        <TextInput
          style={styles.input}
          placeholder="Passwort bestätigen *"
          value={formData.confirmPassword}
          onChangeText={(value) => updateField('confirmPassword', value)}
          secureTextEntry
        />

        <TouchableOpacity 
          style={styles.dropdownButton}
          onPress={openClubDropdown}
        >
          <Text style={[styles.dropdownText, !formData.vereinsname && styles.placeholderText]}>
            {formData.vereinsname || 'Verein auswählen *'}
          </Text>
          <Text style={styles.dropdownArrow}>▼</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Geschlecht (optional)"
          value={formData.geschlecht}
          onChangeText={(value) => updateField('geschlecht', value)}
        />




{/* Hinweistext für Admin-Freigabe */}
<View style={styles.infoBox}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            Nach der Registrierung muss Ihr Account von einem Administrator freigeschaltet werden, 
            bevor Sie die App nutzen können. Sie erhalten eine Benachrichtigung, sobald Ihr Account aktiviert wurde.
          </Text>
        </View>







        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Registrieren</Text>
          )}
        </TouchableOpacity>


        <TouchableOpacity 
          style={styles.linkButton}
          onPress={goToLogin}
        >
          <Text style={styles.linkText}>
            Bereits registriert? Jetzt anmelden
          </Text>
        </TouchableOpacity>
      </View>

      {/* Verein Auswahl Modal */}
      <Modal
        visible={showClubDropdown}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowClubDropdown(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Verein auswählen</Text>
              <TouchableOpacity 
                onPress={() => setShowClubDropdown(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.searchInput}
              placeholder="Verein suchen... (z.B. 'SV Hoh' für SV Hohenfurch)"
              value={clubSearchText}
              onChangeText={filterClubs}
            />

            {loadingClubs ? (
              <ActivityIndicator size="large" color="#DC143C" style={styles.loadingIndicator} />
            ) : (
              <FlatList
                data={filteredClubs}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.clubItem}
                    onPress={() => selectClub(item)}
                  >
                    <Text style={styles.clubName}>{item.name}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.noResultsText}>
                    Keine Vereine gefunden. Versuchen Sie einen anderen Suchbegriff.
                  </Text>
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f5f5f5',
    },
    header: {
      paddingTop: 60,
      paddingBottom: 30,
      alignItems: 'center',
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#DC143C',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: '#666',
    },
    form: {
      backgroundColor: '#fff',
      margin: 20,
      padding: 20,
      borderRadius: 10,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    input: {
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
      padding: 15,
      marginBottom: 15,
      fontSize: 16,
    },
    infoBox: {
      backgroundColor: '#e8f4f8',
      borderLeftWidth: 4,
      borderLeftColor: '#DC143C',
      padding: 15,
      marginBottom: 20,
      borderRadius: 5,
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    infoIcon: {
      fontSize: 18,
      marginRight: 10,
      marginTop: 2,
    },
    infoText: {
      flex: 1,
      fontSize: 14,
      color: '#2c5530',
      lineHeight: 20,
    },
    button: {
      backgroundColor: '#DC143C',
      padding: 15,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 15,
      marginTop: 10,
    },
    buttonDisabled: {
      backgroundColor: '#ccc',
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },
    linkButton: {
      alignItems: 'center',
    },
    linkText: {
      color: '#DC143C',
      fontSize: 14,
    },
    dropdownButton: {
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
      padding: 15,
      marginBottom: 15,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#fff',
    },
    dropdownText: {
      fontSize: 16,
      color: '#000',
    },
    placeholderText: {
      color: '#999',
    },
    dropdownArrow: {
      fontSize: 12,
      color: '#666',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: '#fff',
      borderRadius: 10,
      padding: 20,
      width: '90%',
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#DC143C',
    },
    modalCloseButton: {
      padding: 5,
    },
    modalCloseText: {
      fontSize: 18,
      color: '#666',
    },
    searchInput: {
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
      padding: 15,
      marginBottom: 15,
      fontSize: 16,
    },
    clubItem: {
      padding: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    },
    clubName: {
      fontSize: 16,
      color: '#000',
    },
    noResultsText: {
      textAlign: 'center',
      color: '#666',
      fontSize: 16,
      padding: 20,
    },
    loadingIndicator: {
      marginVertical: 20,
    },
  });
  
  export default RegisterScreen;