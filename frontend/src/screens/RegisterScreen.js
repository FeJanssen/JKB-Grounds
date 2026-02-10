import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  Linking,
} from 'react-native';
import ApiService from '../services/api';
import ScrollableContainer from '../components/ScrollableContainer';

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

  // ✅ DSGVO/AGB COMPLIANCE STATES
  const [agbAccepted, setAgbAccepted] = useState(false);
  const [datenschutzAccepted, setDatenschutzAccepted] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const showError = (message) => {
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  const closeErrorModal = () => {
    setShowErrorModal(false);
    setErrorMessage('');
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setShowSuccessModal(true);
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setSuccessMessage('');
    navigation.navigate('Login'); // Automatisch zum Login weiterleiten
  };

  const updateField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Löscht Fehlermeldung wenn Nutzer tippt
    if (errorMessage) setErrorMessage('');
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
    console.log('handleRegister called', formData); // Debug-Log
    
    // Detaillierte Validierung für jedes Pflichtfeld
    if (!formData.name || formData.name.trim() === '') {
      showError('Bitte geben Sie Ihren Namen ein');
      return;
    }

    if (!formData.email || formData.email.trim() === '') {
      showError('Bitte geben Sie Ihre E-Mail-Adresse ein');
      return;
    }

    // E-Mail Format Validierung
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      showError('Bitte geben Sie eine gültige E-Mail-Adresse ein');
      return;
    }

    if (!formData.password || formData.password.trim() === '') {
      showError('Bitte geben Sie ein Passwort ein');
      return;
    }

    if (!formData.confirmPassword || formData.confirmPassword.trim() === '') {
      showError('Bitte bestätigen Sie Ihr Passwort');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showError('Passwörter stimmen nicht überein');
      return;
    }

    if (formData.password.length < 3) {
      showError('Passwort muss mindestens 3 Zeichen lang sein');
      return;
    }

    if (!formData.vereinsname || formData.vereinsname.trim() === '') {
      showError('Bitte wählen Sie einen Verein aus');
      return;
    }

    // Prüfe ob der ausgewählte Verein existiert
    const selectedClub = clubs.find(club => club.name === formData.vereinsname);
    if (!selectedClub) {
      showError('Bitte wählen Sie einen gültigen Verein aus der Liste');
      return;
    }

    // ✅ DSGVO/AGB COMPLIANCE VALIDATION
    if (!agbAccepted) {
      showError('Sie müssen den Allgemeinen Geschäftsbedingungen zustimmen');
      return;
    }

    if (!datenschutzAccepted) {
      showError('Sie müssen der Datenschutzerklärung zustimmen');
      return;
    }

    // Löscht Fehlermeldung wenn alles OK ist
    setErrorMessage('');

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

      showSuccess(`Willkommen ${response.user.name}!\n\nIhre Registrierung war erfolgreich. Ihr Account wartet nun auf die Freischaltung durch einen Administrator.\n\nSie erhalten eine Benachrichtigung, sobald Ihr Account aktiviert wurde.`);
      
    } catch (error) {
      showError('Registrierung fehlgeschlagen: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <ScrollableContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Registrierung</Text>
        <Text style={styles.subtitle}>JKB Grounds Tennis</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.requiredFieldsNotice}>
          <Text style={styles.requiredFieldsText}>* Pflichtfelder</Text>
        </View>
        
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

        {/* ✅ DSGVO/AGB COMPLIANCE SECTION */}
        <View style={styles.complianceSection}>
          <Text style={styles.complianceSectionTitle}>Rechtliche Zustimmung</Text>
          
          {/* AGB Checkbox */}
          <TouchableOpacity 
            style={styles.checkboxContainer} 
            onPress={() => setAgbAccepted(!agbAccepted)}
          >
            <View style={[styles.checkbox, agbAccepted && styles.checkboxChecked]}>
              {agbAccepted && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>
              Ich stimme den{' '}
              <Text 
                style={styles.linkText} 
                onPress={() => Linking.openURL('https://ihre-domain.com/agb')}
              >
                Allgemeinen Geschäftsbedingungen
              </Text>
              {' '}zu *
            </Text>
          </TouchableOpacity>

          {/* Datenschutz Checkbox */}
          <TouchableOpacity 
            style={styles.checkboxContainer} 
            onPress={() => setDatenschutzAccepted(!datenschutzAccepted)}
          >
            <View style={[styles.checkbox, datenschutzAccepted && styles.checkboxChecked]}>
              {datenschutzAccepted && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>
              Ich stimme der{' '}
              <Text 
                style={styles.linkText} 
                onPress={() => Linking.openURL('https://ihre-domain.com/datenschutz')}
              >
                Datenschutzerklärung
              </Text>
              {' '}zu *
            </Text>
          </TouchableOpacity>

          <Text style={styles.requiredNote}>* Pflichtfelder für die Registrierung</Text>
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

      {/* Success Popup Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeSuccessModal}
      >
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalContent}>
            <View style={styles.successModalHeader}>
              <Text style={styles.successModalIcon}>✅</Text>
              <Text style={styles.successModalTitle}>Registrierung erfolgreich!</Text>
            </View>
            <Text style={styles.successModalMessage}>{successMessage}</Text>
            <TouchableOpacity 
              style={styles.successModalButton}
              onPress={closeSuccessModal}
            >
              <Text style={styles.successModalButtonText}>Zum Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Error Popup Modal */}
      <Modal
        visible={showErrorModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeErrorModal}
      >
        <View style={styles.errorModalOverlay}>
          <View style={styles.errorModalContent}>
            <View style={styles.errorModalHeader}>
              <Text style={styles.errorModalIcon}>⚠️</Text>
              <Text style={styles.errorModalTitle}>Eingabe fehlt</Text>
            </View>
            <Text style={styles.errorModalMessage}>{errorMessage}</Text>
            <TouchableOpacity 
              style={styles.errorModalButton}
              onPress={closeErrorModal}
            >
              <Text style={styles.errorModalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollableContainer>
  );
};

const styles = StyleSheet.create({
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
      marginBottom: 80, // Extra Platz am Ende des Formulars
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
    requiredFieldsNotice: {
      marginBottom: 15,
    },
    requiredFieldsText: {
      fontSize: 14,
      color: '#666',
      textAlign: 'right',
      fontStyle: 'italic',
    },
    errorContainer: {
      backgroundColor: '#ffebee',
      borderLeftWidth: 4,
      borderLeftColor: '#f44336',
      padding: 15,
      marginBottom: 20,
      borderRadius: 5,
    },
    errorText: {
      color: '#c62828',
      fontSize: 16,
      fontWeight: 'bold',
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
    successModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    successModalContent: {
      backgroundColor: '#fff',
      borderRadius: 15,
      padding: 25,
      width: '90%',
      maxWidth: 450,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    successModalHeader: {
      alignItems: 'center',
      marginBottom: 20,
    },
    successModalIcon: {
      fontSize: 50,
      marginBottom: 10,
    },
    successModalTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#27AE60',
      textAlign: 'center',
    },
    successModalMessage: {
      fontSize: 16,
      color: '#333',
      textAlign: 'center',
      marginBottom: 30,
      lineHeight: 24,
    },
    successModalButton: {
      backgroundColor: '#27AE60',
      paddingHorizontal: 40,
      paddingVertical: 15,
      borderRadius: 25,
      minWidth: 150,
    },
    successModalButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    errorModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorModalContent: {
      backgroundColor: '#fff',
      borderRadius: 15,
      padding: 25,
      width: '85%',
      maxWidth: 400,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    errorModalHeader: {
      alignItems: 'center',
      marginBottom: 20,
    },
    errorModalIcon: {
      fontSize: 40,
      marginBottom: 10,
    },
    errorModalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#DC143C',
      textAlign: 'center',
    },
    errorModalMessage: {
      fontSize: 16,
      color: '#333',
      textAlign: 'center',
      marginBottom: 25,
      lineHeight: 22,
    },
    errorModalButton: {
      backgroundColor: '#DC143C',
      paddingHorizontal: 40,
      paddingVertical: 12,
      borderRadius: 25,
      minWidth: 120,
    },
    errorModalButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    
    // ✅ DSGVO/AGB COMPLIANCE STYLES
    complianceSection: {
      backgroundColor: '#f8f9fa',
      borderRadius: 10,
      padding: 16,
      marginVertical: 16,
      borderWidth: 1,
      borderColor: '#e9ecef',
    },
    complianceSectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 12,
      textAlign: 'center',
    },
    checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginVertical: 8,
      paddingRight: 10,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderWidth: 2,
      borderColor: '#ccc',
      borderRadius: 3,
      marginRight: 12,
      marginTop: 2,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#fff',
    },
    checkboxChecked: {
      backgroundColor: '#DC143C',
      borderColor: '#DC143C',
    },
    checkmark: {
      color: '#fff',
      fontSize: 12,
      fontWeight: 'bold',
    },
    checkboxLabel: {
      fontSize: 14,
      color: '#333',
      lineHeight: 20,
      flex: 1,
    },
    linkText: {
      color: '#DC143C',
      textDecorationLine: 'underline',
      fontWeight: '500',
    },
    requiredNote: {
      fontSize: 12,
      color: '#666',
      fontStyle: 'italic',
      textAlign: 'center',
      marginTop: 12,
    },
  });
  
  export default RegisterScreen;