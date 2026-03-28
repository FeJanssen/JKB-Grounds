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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import ApiService from '../services/api';

const ResetPasswordScreen = ({ navigation, route }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [debugInfo, setDebugInfo] = useState('');

  const token = route.params?.token;

  useEffect(() => {
    setDebugInfo(`Token: ${token ? 'vorhanden' : 'fehlt'}`);
    verifyToken();
  }, []);

  const verifyToken = async () => {
    console.log('🔍 ResetPasswordScreen - Token aus Params:', token);
    setDebugInfo(prev => prev + '\nToken-Verifikation gestartet...');
    
    if (!token) {
      console.log('❌ Kein Token gefunden');
      setDebugInfo(prev => prev + '\n❌ Kein Token gefunden');
      Alert.alert(
        'Ungültiger Link',
        'Dieser Link ist ungültig. Bitte fordern Sie einen neuen an.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
      return;
    }

    try {
      console.log('📡 Versuche Token zu verifizieren:', token);
      setDebugInfo(prev => prev + '\n📡 API-Aufruf...');
      
      const response = await ApiService.verifyResetToken(token);
      console.log('📡 Token-Verifikation Response:', response);
      setDebugInfo(prev => prev + '\n✅ Response erhalten');
      
      if (response.valid) {
        console.log('✅ Token ist gültig, setze Zustand');
        setDebugInfo(prev => prev + '\n✅ Token gültig - zeige Formular');
        setTokenValid(true);
        setUserEmail(response.email);
      } else {
        console.log('❌ Token ist ungültig');
        setDebugInfo(prev => prev + '\n❌ Token ungültig');
        Alert.alert(
          'Link abgelaufen',
          'Dieser Link ist abgelaufen oder wurde bereits verwendet. Bitte fordern Sie einen neuen an.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
      }
    } catch (error) {
      console.log('❌ Token-Verifikation Fehler:', error);
      setDebugInfo(prev => prev + `\n❌ Fehler: ${error.message}`);
      Alert.alert(
        'Fehler',
        `Es ist ein Fehler aufgetreten: ${error.message}. Bitte versuchen Sie es später erneut.`,
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } finally {
      console.log('🏁 Token-Verifikation abgeschlossen');
      setDebugInfo(prev => prev + '\n🏁 Verifikation abgeschlossen');
      setVerifying(false);
    }
  };

  const handleSubmit = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Fehler', 'Bitte füllen Sie alle Felder aus');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Fehler', 'Das Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Fehler', 'Die Passwörter stimmen nicht überein');
      return;
    }

    setLoading(true);

    try {
      const response = await ApiService.resetPassword(token, newPassword);
      
      Alert.alert(
        'Passwort geändert',
        'Ihr Passwort wurde erfolgreich geändert. Sie können sich jetzt mit dem neuen Passwort anmelden.',
        [
          {
            text: 'Zur Anmeldung',
            onPress: () => navigation.navigate('Login')
          }
        ]
      );
      
    } catch (error) {
      Alert.alert(
        'Fehler', 
        error.message || 'Es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#DC143C" />
        <Text style={styles.loadingText}>Link wird überprüft...</Text>
        <Text style={styles.debugText}>Token: {token}</Text>
        <Text style={styles.debugText}>{debugInfo}</Text>
      </View>
    );
  }

  // DEBUG: Zeige aktuellen Zustand
  console.log('🎯 Current State:', { verifying, tokenValid, userEmail, debugInfo });

  if (!tokenValid) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Token ist ungültig</Text>
        <Text style={styles.debugText}>Token: {token}</Text>
        <Text style={styles.debugText}>{debugInfo}</Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.buttonText}>Zur Anmeldung</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // DEBUG: Wenn wir hier sind, sollte das Formular gezeigt werden
  console.log('🎯 Zeige Formular! TokenValid:', tokenValid);

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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Neues Passwort</Text>
          <Text style={styles.subtitle}>JKB Tennisclub</Text>
        </View>

        {/* DEBUG INFO */}
        <View style={styles.debugContainer}>
          <Text style={styles.debugText}>DEBUG INFO:</Text>
          <Text style={styles.debugText}>Token: {token || 'Kein Token'}</Text>
          <Text style={styles.debugText}>Token Valid: {tokenValid ? 'JA' : 'NEIN'}</Text>
          <Text style={styles.debugText}>Verifying: {verifying ? 'JA' : 'NEIN'}</Text>
          <Text style={styles.debugText}>Email: {userEmail || 'Keine Email'}</Text>
          <Text style={styles.debugText}>{debugInfo}</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.welcomeText}>Passwort ändern</Text>
          
          {userEmail ? (
            <Text style={styles.emailText}>
              für {userEmail}
            </Text>
          ) : null}
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Neues Passwort"
              placeholderTextColor="#999"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Passwort bestätigen"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>

          <Text style={styles.passwordHint}>
            Das Passwort muss mindestens 6 Zeichen lang sein.
          </Text>

          {/* Submit Button */}
          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Passwort ändern</Text>
            )}
          </TouchableOpacity>

          {/* Back Button */}
          <TouchableOpacity 
            style={styles.linkButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.linkText}>
              Zurück zur Anmeldung
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
    backgroundColor: '#fff',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: '#DC143C',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  form: {
    flex: 1,
    padding: 25,
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  emailText: {
    fontSize: 16,
    color: '#666',
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
  passwordHint: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
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
    shadowRadius: 4.65,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  linkButton: {
    alignItems: 'center',
    padding: 15,
  },
  linkText: {
    color: '#DC143C',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  debugText: {
    marginTop: 10,
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#DC143C',
    textAlign: 'center',
    marginBottom: 20,
  },
  debugContainer: {
    backgroundColor: '#f0f0f0',
    margin: 10,
    padding: 10,
    borderRadius: 5,
  },
});

export default ResetPasswordScreen;
