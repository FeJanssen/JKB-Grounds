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
  KeyboardAvoidingView,
  Platform,
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
    
    // 🔧 OFFLINE/DEMO MODUS - Kein Backend nötig!
    if (email === 'demo' && password === 'demo') {
      console.log('🔧 DEMO MODUS aktiviert - Offline Login');
      
      const demoUser = {
        id: 'demo-user-123',
        email: 'demo@example.com',
        name: 'Demo User',
        verein_id: 'demo-verein-1',
        rolle_id: '1'
      };
      
      try {
        await setUser(demoUser);
        await AsyncStorage.setItem('userId', demoUser.id);
        await AsyncStorage.setItem('user_id', demoUser.id);
        await AsyncStorage.setItem('nutzer_id', demoUser.id);
        await AsyncStorage.setItem('rolleId', demoUser.rolle_id);
        await AsyncStorage.setItem('vereinId', demoUser.verein_id);
        
        console.log('✅ Demo User gespeichert:', demoUser);
        setLoading(false);
        
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
        return;
      } catch (error) {
        console.error('Demo-Login Fehler:', error);
        Alert.alert('Demo-Login fehlgeschlagen', error.message);
        setLoading(false);
        return;
      }
    }
    
    // NORMALER LOGIN mit Backend
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
        
        // VEREIN-ID speichern (wichtig für HomeScreen)
        if (response.user.verein_id) {
          await AsyncStorage.setItem('verein_id', response.user.verein_id.toString());
          console.log('🏛️ Verein-ID gespeichert:', response.user.verein_id);
        } else {
          console.warn('⚠️ Keine verein_id im User-Objekt gefunden:', response.user);
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

  const handleForgotPassword = () => {
    Alert.alert(
      'Passwort vergessen',
      'Diese Funktion wird in einer zukünftigen Version verfügbar sein.',
      [{ text: 'OK' }]
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header mit Gradient-Effekt */}
        <View style={styles.header}>
          <Text style={styles.title}>SV Hohenfurch</Text>
          <Text style={styles.subtitle}>Tennis Buchung</Text>
        </View>

        {/* Login Form */}
        <View style={styles.form}>
          <Text style={styles.welcomeText}>Willkommen zurück!</Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="E-Mail Adresse"
              placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Passwort"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        {/* Passwort vergessen Link */}
        <TouchableOpacity 
          style={styles.forgotPasswordButton}
          onPress={handleForgotPassword}
        >
          <Text style={styles.forgotPasswordText}>
            Passwort vergessen?
          </Text>
        </TouchableOpacity>

        {/* Login Button */}
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

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>oder</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Registrierung */}
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={goToRegister}
        >
          <Text style={styles.secondaryButtonText}>
            Neues Konto erstellen
          </Text>
        </TouchableOpacity>

        {/* Vereinsinfos */}
        <TouchableOpacity 
          style={styles.publicInfoButton}
          onPress={() => navigation.navigate('PublicClubList')}
        >
          <Text style={styles.publicInfoText}>
            Vereinsinfos ansehen
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
    minHeight: '100%',
  },
  header: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#DC143C',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    minHeight: 200,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: -20,
    borderRadius: 20,
    padding: 30,
    minHeight: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderRadius: 12,
    padding: 18,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
    color: '#333',
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 25,
    marginTop: -10,
  },
  forgotPasswordText: {
    color: '#DC143C',
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#DC143C',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#DC143C',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e9ecef',
  },
  dividerText: {
    marginHorizontal: 15,
    color: '#6c757d',
    fontSize: 14,
    fontWeight: '500',
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: '#DC143C',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    color: '#DC143C',
    fontSize: 16,
    fontWeight: '600',
  },
  publicInfoButton: {
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
  },
  publicInfoText: {
    color: '#6c757d',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default LoginScreen;