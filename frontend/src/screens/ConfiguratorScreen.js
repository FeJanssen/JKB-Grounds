import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  Switch,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from 'react-native';

const ConfiguratorScreen = () => {
  const [activeTab, setActiveTab] = useState('courts');
  const [courts, setCourts] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // ✅ DYNAMISCHE VEREIN-ID
  const [currentVereinId, setCurrentVereinId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCourt, setEditingCourt] = useState(null);
  const [courtForm, setCourtForm] = useState({
    name: '',
    platztyp: '',
    aktiv_von: '',
    aktiv_bis: '',
    buchbar_von: '07:00',
    buchbar_bis: '22:00',
    preise: {}
  });
  
  const VERFUEGBARE_RECHTE = [
    { 
      key: 'darf_buchen', 
      label: 'Darf buchen', 
      beschreibung: 'Kann Plätze buchen', 
      icon: '🎾' 
    },
    { 
      key: 'darf_oeffentlich_buchen', 
      label: 'Darf öffentlich buchen', 
      beschreibung: 'Kann öffentliche Buchungen machen', 
      icon: '🌍' 
    },
  ];

  useEffect(() => {
    loadData();
  }, []);

  // ✅ DYNAMISCHE USER & VEREIN-ID LADEN
  const loadUserData = async () => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      
      // ✅ ALLE VARIANTEN VERSUCHEN: userId, user_id, nutzer_id
      let userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        userId = await AsyncStorage.getItem('user_id');
      }
      if (!userId) {
        userId = await AsyncStorage.getItem('nutzer_id');
      }
      
      console.log('🔍 Konfigurator: Alle AsyncStorage Keys:');
      const allKeys = await AsyncStorage.getAllKeys();
      console.log('📋 Verfügbare Keys:', allKeys);
      
      if (!userId) {
        throw new Error('Keine User-ID gefunden. Bitte neu einloggen.');
      }
      
      setCurrentUserId(userId);
      console.log('👤 Konfigurator: User-ID geladen:', userId);
      
      // User-Daten laden um Verein-ID zu bekommen
      const userResponse = await fetch(`https://jkb-grounds-production.up.railway.app/api/auth/auth/user/${userId}`);
      if (!userResponse.ok) {
        throw new Error('User-Daten konnten nicht geladen werden');
      }
      
      const userData = await userResponse.json();
      const vereinId = userData.verein_id;
      
      if (!vereinId) {
        throw new Error('Keine Verein-ID für User gefunden');
      }
      
      setCurrentVereinId(vereinId);
      console.log('🏢 Konfigurator: Verein-ID geladen:', vereinId);
      
      return vereinId;
      
    } catch (error) {
      console.error('❌ Fehler beim Laden der User-Daten:', error);
      setError('Fehler beim Laden der Benutzerdaten');
      throw error;
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Lade Konfigurator-Daten...');
      
      // Erst User-Daten laden, dann Rest
      const vereinId = await loadUserData();
      
      // Jetzt mit der geladenen Verein-ID die anderen Daten laden
      await Promise.all([
        loadCourtsByVereinId(vereinId),
        loadRoles(),
        loadPermissions()
      ]);
      
      console.log('✅ Alle Daten geladen');
    } catch (error) {
      console.error('❌ Fehler beim Laden der Daten:', error);
      setError('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  // ✅ REFRESH HANDLER wie im CRM
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const loadCourtsByVereinId = async (vereinId) => {
    try {
      console.log('🎾 Lade Plätze für Verein:', vereinId);
      
      if (!vereinId) {
        throw new Error('Keine Verein-ID verfügbar');
      }
      
      const response = await fetch(`https://jkb-grounds-production.up.railway.app/api/courts/verein/${vereinId}`);
      
      console.log('📡 Courts API Response Status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🎾 Courts Response:', data);
        
        if (Array.isArray(data)) {
          setCourts(data);
          console.log('✅ Plätze geladen:', data.length);
        } else if (data.courts && Array.isArray(data.courts)) {
          setCourts(data.courts);
          console.log('✅ Plätze aus data.courts geladen:', data.courts.length);
        } else if (data.data && Array.isArray(data.data)) {
          setCourts(data.data);
          console.log('✅ Plätze aus data.data geladen:', data.data.length);
        } else {
          console.log('⚠️ Unerwartete Courts-Struktur:', data);
          setCourts([]);
        }
      } else {
        console.log('❌ Courts API Fehler:', response.status);
        const errorText = await response.text();
        console.log('❌ Error details:', errorText);
        setCourts([]);
      }
    } catch (error) {
      console.error('❌ Fehler beim Laden der Plätze:', error);
      setCourts([]);
    }
  };

  const loadCourts = async () => {
    if (currentVereinId) {
      await loadCourtsByVereinId(currentVereinId);
    } else {
      console.log('⚠️ Keine Verein-ID verfügbar für loadCourts');
    }
  };

  const loadRoles = async () => {
    try {
      console.log('👥 Lade Rollen...');
      const response = await fetch('https://jkb-grounds-production.up.railway.app/api/roles');
      
      console.log('📡 Roles API Response Status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('👥 Roles Response:', data);
        
        if (Array.isArray(data)) {
          setRoles(data);
          console.log('✅ Rollen geladen:', data.length);
        } else if (data.roles && Array.isArray(data.roles)) {
          setRoles(data.roles);
          console.log('✅ Rollen aus data.roles geladen:', data.roles.length);
        } else {
          console.log('⚠️ Unerwartete Roles-Struktur, setze leeres Array');
          setRoles([]);
        }
      } else {
        console.log('❌ Roles API Fehler:', response.status);
        setRoles([]);
      }
    } catch (error) {
      console.error('❌ Fehler beim Laden der Rollen:', error);
      setRoles([]);
    }
  };

  const loadPermissions = async () => {
    try {
      console.log('🔐 Lade Berechtigungen...');
      
      if (!currentVereinId) {
        throw new Error('Keine Verein-ID verfügbar');
      }
      
      const response = await fetch(`https://jkb-grounds-production.up.railway.app/api/permissions/verein/${currentVereinId}`);
      
      console.log('📡 Permissions API Response Status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔐 Permissions Response:', data);
        
        if (Array.isArray(data)) {
          setPermissions(data);
          console.log('✅ Berechtigungen geladen:', data.length);
        } else if (data.permissions && Array.isArray(data.permissions)) {
          setPermissions(data.permissions);
          console.log('✅ Berechtigungen aus data.permissions geladen:', data.permissions.length);
        } else {
          console.log('⚠️ Unerwartete Permissions-Struktur, setze leeres Array');
          setPermissions([]);
        }
      } else {
        console.log('❌ Permissions API Fehler:', response.status);
        setPermissions([]);
      }
    } catch (error) {
      console.error('❌ Fehler beim Laden der Berechtigungen:', error);
      setPermissions([]);
    }
  };

  // LOADING SCREEN mit Overlay wie im CRM
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2E8B57" />
          <Text style={styles.loadingText}>Lade Konfigurator...</Text>
        </View>
      </View>
    );
  }

  // ERROR SCREEN
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>⚙️ Konfigurator</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>❌ {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadData}>
            <Text style={styles.retryButtonText}>🔄 Erneut versuchen</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const openCourtModal = (court = null) => {
    if (court) {
      setEditingCourt(court);
      setCourtForm({
        name: court.name,
        platztyp: court.platztyp || '',
        aktiv_von: court.aktiv_von || '',
        aktiv_bis: court.aktiv_bis || '',
        buchbar_von: court.buchbar_von || '07:00',
        buchbar_bis: court.buchbar_bis || '22:00',
        preise: {}
      });
    } else {
      setEditingCourt(null);
      setCourtForm({
        name: '',
        platztyp: '',
        aktiv_von: '',
        aktiv_bis: '',
        buchbar_von: '07:00',
        buchbar_bis: '22:00',
        preise: {}
      });
    }
    setModalVisible(true);
  };

  const saveCourt = async () => {
    try {
      if (!currentVereinId) {
        Alert.alert('Fehler', 'Keine Verein-ID verfügbar');
        return;
      }
      
      if (!currentUserId) {
        Alert.alert('Fehler', 'Keine User-ID verfügbar');
        return;
      }
      
      const courtData = {
        ...courtForm,
        verein_id: currentVereinId
      };

      const url = editingCourt 
        ? `https://jkb-grounds-production.up.railway.app/api/courts/${editingCourt.id}`
        : 'https://jkb-grounds-production.up.railway.app/api/courts';
      
      const method = editingCourt ? 'PUT' : 'POST';

      console.log('💾 Speichere Platz:', {
        method,
        url,
        courtData,
        userId: currentUserId
      });

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': currentUserId
        },
        body: JSON.stringify(courtData)
      });

      if (response.ok) {
        if (Platform.OS === 'web') {
          window.alert('Platz wurde gespeichert!');
        } else {
          Alert.alert('Erfolg', 'Platz wurde gespeichert!');
        }
        
        setModalVisible(false);
        loadCourts();
      } else {
        const errorText = await response.text();
        console.log('❌ Save Court Error:', response.status, errorText);
        throw new Error(`Fehler beim Speichern: ${response.status}`);
      }
    } catch (error) {
      if (Platform.OS === 'web') {
        window.alert('Platz konnte nicht gespeichert werden: ' + error.message);
      } else {
        Alert.alert('Fehler', 'Platz konnte nicht gespeichert werden: ' + error.message);
      }
      
      console.error('❌ Fehler beim Speichern:', error);
    }
  };

  const deleteCourt = async (platzId) => {
    console.log('🗑️ deleteCourt aufgerufen mit ID:', platzId);
    
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Möchten Sie diesen Platz wirklich löschen?');
      
      if (confirmed) {
        console.log('💥 Löschen bestätigt (Web) - starte Request...');
        await performDelete(platzId);
      } else {
        console.log('❌ Löschen abgebrochen (Web)');
      }
    } else {
      Alert.alert(
        'Platz löschen',
        'Möchten Sie diesen Platz wirklich löschen?',
        [
          { 
            text: 'Abbrechen', 
            style: 'cancel',
            onPress: () => console.log('❌ Löschen abgebrochen (Mobile)')
          },
          {
            text: 'Löschen',
            style: 'destructive',
            onPress: () => {
              console.log('💥 Löschen bestätigt (Mobile) - starte Request...');
              performDelete(platzId);
            }
          }
        ]
      );
    }
  };

  const performDelete = async (platzId) => {
    try {
      console.log('🔄 Sende DELETE-Request für:', platzId);
      
      if (!currentUserId) {
        Alert.alert('Fehler', 'Keine User-ID verfügbar');
        return;
      }
      
      const response = await fetch(`https://jkb-grounds-production.up.railway.app/api/courts/${platzId}`, {
        method: 'DELETE',
        headers: {
          'X-User-ID': currentUserId
        }
      });

      console.log('📡 DELETE Response Status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ DELETE erfolgreich:', data);
        
        if (Platform.OS === 'web') {
          window.alert('Platz wurde gelöscht!');
        } else {
          Alert.alert('Erfolg', 'Platz wurde gelöscht!');
        }
        
        await loadCourts();
      } else {
        const errorText = await response.text();
        console.error('❌ DELETE Fehler:', response.status, errorText);
        
        if (Platform.OS === 'web') {
          window.alert(`Löschen fehlgeschlagen: ${response.status}`);
        } else {
          Alert.alert('Fehler', `Löschen fehlgeschlagen: ${response.status}`);
        }
      }
    } catch (error) {
      console.error('❌ Exception beim Löschen:', error);
      
      if (Platform.OS === 'web') {
        window.alert('Netzwerkfehler beim Löschen');
      } else {
        Alert.alert('Fehler', 'Netzwerkfehler beim Löschen');
      }
    }
  };

  const hasPermission = (roleId, rechtKey) => {
    if (!Array.isArray(permissions)) return false;
    const permission = permissions.find(p => p.rolle_id === roleId);
    return permission ? permission[rechtKey] || false : false;
  };

  const togglePermission = async (roleId, rechtKey, isActive) => {
    try {
      if (!currentVereinId) {
        Alert.alert('Fehler', 'Keine Verein-ID verfügbar');
        return;
      }
      
      const payload = {
        verein_id: currentVereinId,
        rolle_id: roleId,
        recht_key: rechtKey,
        ist_aktiv: isActive
      };
      
      console.log('🔄 Toggle Berechtigung Request:', payload);
      
      const response = await fetch('https://jkb-grounds-production.up.railway.app/api/permissions/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': '626093ad-1de3-454f-af72-fd38030613f7'
        },
        body: JSON.stringify(payload)
      });

      console.log('📡 Response Status:', response.status);
      
      const responseText = await response.text();
      console.log('📡 Response Text:', responseText);
      
      if (response.ok) {
        console.log(`✅ Berechtigung "${rechtKey}" für Rolle ${roleId}: ${isActive ? 'aktiviert' : 'deaktiviert'}`);
        await loadPermissions();
      } else {
        console.error('❌ API-Fehler Details:', responseText);
        throw new Error(`API-Fehler: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Fehler beim Ändern der Berechtigung:', error);
      
      if (Platform.OS === 'web') {
        window.alert('Berechtigung konnte nicht geändert werden: ' + error.message);
      } else {
        Alert.alert('Fehler', 'Berechtigung konnte nicht geändert werden');
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* ✅ FIXED HEADER wie im CRM */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⚙️ Konfigurator</Text>
      </View>

      {/* ✅ TAB SELECTOR außerhalb des ScrollView */}
      <View style={styles.tabSelector}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'courts' && styles.activeTabButton]}
          onPress={() => setActiveTab('courts')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'courts' && styles.activeTabButtonText]}>
            🎾 Plätze
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'permissions' && styles.activeTabButton]}
          onPress={() => setActiveTab('permissions')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'permissions' && styles.activeTabButtonText]}>
            🔐 Berechtigungen
          </Text>
        </TouchableOpacity>
      </View>

      {/* ✅ WEB-KOMPATIBLES SCROLLING - ohne eigenen ScrollView */}
      <View style={styles.content} testID="configurator-screen">
        {activeTab === 'courts' ? (
          // PLÄTZE TAB
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Plätze verwalten ({courts.length})</Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => openCourtModal()}
              >
                <Text style={styles.addButtonText}>+ Neuer Platz</Text>
              </TouchableOpacity>
            </View>

            {Array.isArray(courts) && courts.length > 0 ? (
              courts.map((court) => (
                <View key={court.id} style={styles.courtCard}>
                  <View style={styles.courtInfo}>
                    <Text style={styles.courtName}>{court.name}</Text>
                    <Text style={styles.courtDetails}>🎾 {court.platztyp}</Text>
                    <Text style={styles.courtTimes}>
                      🕐 Buchbar: {court.buchbar_von || '07:00'} - {court.buchbar_bis || '22:00'}
                    </Text>
                  </View>
                  <View style={styles.courtActions}>
                    <TouchableOpacity 
                      style={styles.editButton}
                      onPress={() => openCourtModal(court)}
                    >
                      <Text style={styles.editButtonText}>✏️ Bearbeiten</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => {
                        console.log('🗑️ Delete Button gedrückt für:', court.id, court.name);
                        deleteCourt(court.id);
                      }}
                    >
                      <Text style={styles.deleteButtonText}>🗑️ Löschen</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Keine Plätze vorhanden</Text>
                <Text style={styles.emptySubtext}>Erstellen Sie Ihren ersten Platz</Text>
              </View>
            )}
          </>
        ) : (
          // BERECHTIGUNGEN TAB
          <>
            <Text style={styles.sectionTitle}>Berechtigungen verwalten</Text>
            <Text style={styles.subtitle}>
              Legen Sie fest, welche Rechte jede Rolle in Ihrem Verein haben soll.
            </Text>
            
            {Array.isArray(roles) && roles.length > 0 ? (
              roles.map((role) => (
                <View key={role.id} style={styles.roleCard}>
                  <Text style={styles.roleName}>👤 {role.name}</Text>
                  
                  {VERFUEGBARE_RECHTE.map((recht) => (
                    <View key={recht.key} style={styles.permissionRow}>
                      <View style={styles.permissionInfo}>
                        <Text style={styles.permissionName}>
                          {recht.icon} {recht.label}
                        </Text>
                        <Text style={styles.permissionDescription}>
                          {recht.beschreibung}
                        </Text>
                      </View>
                      <Switch
                        value={hasPermission(role.id, recht.key)}
                        onValueChange={(value) => togglePermission(role.id, recht.key, value)}
                        trackColor={{ false: '#767577', true: '#2E8B57' }}
                        thumbColor={hasPermission(role.id, recht.key) ? '#fff' : '#f4f3f4'}
                      />
                    </View>
                  ))}
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Keine Rollen vorhanden</Text>
                <Text style={styles.emptySubtext}>Rollen werden automatisch geladen</Text>
              </View>
            )}
          </>
        )}
      </View>

      {/* Modal bleibt unverändert */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingCourt ? 'Platz bearbeiten' : 'Neuer Platz'}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={courtForm.name}
                onChangeText={(text) => setCourtForm({...courtForm, name: text})}
                placeholder="z.B. Platz 1"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Platztyp</Text>
              <TextInput
                style={styles.input}
                value={courtForm.platztyp}
                onChangeText={(text) => setCourtForm({...courtForm, platztyp: text})}
                placeholder="z.B. Außenplatz Sand, Innenplatz Teppich, Rasenplatz"
              />
            </View>

            <View style={styles.timeRow}>
              <View style={styles.timeGroup}>
                <Text style={styles.label}>Buchbar von</Text>
                <TextInput
                  style={styles.timeInput}
                  value={courtForm.buchbar_von}
                  onChangeText={(text) => setCourtForm({...courtForm, buchbar_von: text})}
                  placeholder="07:00"
                />
              </View>
              <View style={styles.timeGroup}>
                <Text style={styles.label}>Buchbar bis</Text>
                <TextInput
                  style={styles.timeInput}
                  value={courtForm.buchbar_bis}
                  onChangeText={(text) => setCourtForm({...courtForm, buchbar_bis: text})}
                  placeholder="22:00"
                />
              </View>
            </View>

            <View style={styles.dateRow}>
              <View style={styles.dateGroup}>
                <Text style={styles.label}>Aktiv von (Datum)</Text>
                <TextInput
                  style={styles.dateInput}
                  value={courtForm.aktiv_von}
                  onChangeText={(text) => setCourtForm({...courtForm, aktiv_von: text})}
                  placeholder="2025-01-01"
                />
              </View>
              <View style={styles.dateGroup}>
                <Text style={styles.label}>Aktiv bis (Datum)</Text>
                <TextInput
                  style={styles.dateInput}
                  value={courtForm.aktiv_bis}
                  onChangeText={(text) => setCourtForm({...courtForm, aktiv_bis: text})}
                  placeholder="2025-12-31"
                />
              </View>
            </View>

            <Text style={styles.sectionTitle}>Preise pro Rolle</Text>
            {Array.isArray(roles) && roles.map((role) => (
              <View key={role.id} style={styles.priceRow}>
                <Text style={styles.roleName}>{role.name}:</Text>
                <TextInput
                  style={styles.priceInput}
                  value={courtForm.preise[role.id]?.toString() || ''}
                  onChangeText={(text) => setCourtForm({
                    ...courtForm,
                    preise: {...courtForm.preise, [role.id]: parseFloat(text) || 0}
                  })}
                  placeholder="0.00"
                  keyboardType="numeric"
                />
                <Text style={styles.currency}>€</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Abbrechen</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={saveCourt}
            >
              <Text style={styles.saveButtonText}>Speichern</Text>
            </TouchableOpacity>
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
  // ✅ TAB SELECTOR zwischen Header und Content
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    marginHorizontal: 5,
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: '#2E8B57',
  },
  tabButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  activeTabButtonText: {
    color: '#fff',
  },
  // ✅ WEB-KOMPATIBLES SCROLLING
  content: {
    padding: 20,
    minHeight: '200vh', // ✅ WEB: Genug Höhe um Scrolling zu erzwingen
    overflow: 'visible', // ✅ WEB: Erlaube Overflow
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2E8B57',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  addButton: {
    backgroundColor: '#2E8B57',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  courtCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  courtInfo: {
    flex: 1,
  },
  courtName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  courtDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  courtTimes: {
    fontSize: 12,
    color: '#999',
  },
  courtActions: {
    flexDirection: 'column',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  roleCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roleName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  permissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  permissionInfo: {
    flex: 1,
    marginRight: 12,
  },
  permissionName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  permissionDescription: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  timeGroup: {
    flex: 1,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    textAlign: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  dateGroup: {
    flex: 1,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    textAlign: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  priceInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    flex: 1,
    textAlign: 'right',
  },
  currency: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#2E8B57',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});

export default ConfiguratorScreen;