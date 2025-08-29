import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import ApiService from '../services/api';

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    verein_id: '', // Jetzt leer - Benutzer muss eingeben
    vereinspasswort: '',
    geschlecht: ''
  });
  const [loading, setLoading] = useState(false);

  const updateField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRegister = async () => {
    // Validierung
    if (!formData.name || !formData.email || !formData.password || !formData.verein_id || !formData.vereinspasswort) {
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

    setLoading(true);
    try {
      const registerData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        verein_id: formData.verein_id.trim(),
        vereinspasswort: formData.vereinspasswort.trim(),
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

        <TextInput
          style={styles.input}
          placeholder="Verein-ID *"
          value={formData.verein_id}
          onChangeText={(value) => updateField('verein_id', value)}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          style={styles.input}
          placeholder="Vereinspasswort *"
          value={formData.vereinspasswort}
          onChangeText={(value) => updateField('vereinspasswort', value)}
        />

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
      color: '#2E8B57',
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
      borderLeftColor: '#2E8B57',
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
      backgroundColor: '#2E8B57',
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
      color: '#2E8B57',
      fontSize: 14,
    },
  });
  
  export default RegisterScreen;