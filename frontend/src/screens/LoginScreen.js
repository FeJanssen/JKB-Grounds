import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/api';
import { useUser } from '../context/UserContext';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { setUser } = useUser();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Fehler', 'Bitte alle Felder ausfüllen');
      return;
    }

    setLoading(true);
    try {
      const response = await ApiService.login({
        email: email.trim(),
        password: password
      });

      console.log('Login Response:', response);

      // USER-DATEN SPEICHERN
      if (response.user) {
        await setUser(response.user);
        console.log('User gespeichert:', response.user);
        
        // ⚠️ WICHTIG: USER-ID SEPARAT SPEICHERN FÜR SIMPLETABNAVIGATOR ⚠️
        await AsyncStorage.setItem('userId', response.user.id);
        console.log('✅ User-ID gespeichert für SimpleTabNavigator:', response.user.id);
        
        // OPTIONAL: Auch rolle_id speichern falls verfügbar
        if (response.user.rolle_id) {
          await AsyncStorage.setItem('rolleId', response.user.rolle_id);
          console.log('📋 Rolle-ID gespeichert:', response.user.rolle_id);
        }
        
      } else {
        console.warn('Keine User-Daten in Response:', response);
      }

      // TOKEN SPEICHERN (falls vorhanden)
      if (response.access_token) {
        await AsyncStorage.setItem('access_token', response.access_token);
        console.log('🔑 Access-Token gespeichert');
      }

      // Login erfolgreich - direkt zur Home navigieren
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
      
    } catch (error) {
      console.error('Login Fehler:', error);
      Alert.alert('Anmeldung fehlgeschlagen', error.message);
    } finally {
      setLoading(false);
    }
  };

  const goToRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>JKB Grounds</Text>
      <Text style={styles.subtitle}>Tennis Buchung</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          style={styles.input}
          placeholder="Passwort"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Anmelden</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.linkButton}
          onPress={goToRegister}
        >
          <Text style={styles.linkText}>
            Noch kein Konto? Jetzt registrieren
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#2E8B57',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: '#666',
    marginBottom: 40,
  },
  form: {
    backgroundColor: '#fff',
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
  button: {
    backgroundColor: '#2E8B57',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
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

export default LoginScreen;