import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  StatusBar,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { crmService } from '../services/crmService'; // ← Backend Service importieren

const CRMScreen = () => {
  // STATE - Backend-ready
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [pendingRegistrations, setPendingRegistrations] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0 });
  const [roles, setRoles] = useState([]);
  
  // MODALS
  const [addPersonModal, setAddPersonModal] = useState(false);
  const [userDetailModal, setUserDetailModal] = useState(false);
  const [editUserModal, setEditUserModal] = useState(false);
  const [registrationsModal, setRegistrationsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // FORM STATE
  const [newPerson, setNewPerson] = useState({
    vorname: '',
    nachname: '',
    email: '',
    passwort: '',
    geschlecht: 'männlich',
    rolle: 'Mitglied'
  });

  const [editPerson, setEditPerson] = useState({
    id: '',
    vorname: '',
    nachname: '',
    email: '',
    passwort: '',
    geschlecht: 'männlich',
    rolle: 'Mitglied'
  });

  // LOAD ALL DATA FROM BACKEND
  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, selectedRole, selectedGender]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      console.log('🔄 Lade CRM-Daten vom Backend...');
      
      // Parallel laden für bessere Performance
      const [usersData, pendingData, statsData, rolesData] = await Promise.all([
        crmService.getUsers(),
        crmService.getPendingRegistrations(),
        crmService.getStats(),
        crmService.getRoles()
      ]);

      setUsers(usersData || []);
      setPendingRegistrations(pendingData || []);
      setStats(statsData || { total: 0, pending: 0 });
      setRoles(rolesData || []);
      
      console.log('✅ CRM-Daten geladen:', {
        users: usersData?.length || 0,
        pending: pendingData?.length || 0,
        stats: statsData,
        roles: rolesData?.length || 0
      });
    } catch (error) {
      console.error('❌ Fehler beim Laden der CRM-Daten:', error);
      Alert.alert('Fehler', 'CRM-Daten konnten nicht geladen werden: ' + error.message);
      
      // Leere Arrays als Fallback - keine hardcodierten Demo-Daten
      setUsers([]);
      setPendingRegistrations([]);
      setStats({ total: 0, pending: 0 });
      setRoles([
        { id: 1, name: 'Admin' },
        { id: 2, name: 'Trainer' },
        { id: 3, name: 'Mannschaftsführer' },
        { id: 4, name: 'Mitglied' },
        { id: 5, name: 'Gast' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // REFRESH DATA
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadInitialData();
      Alert.alert('Aktualisiert', 'Daten wurden erfolgreich aktualisiert');
    } catch (error) {
      Alert.alert('Fehler', 'Aktualisierung fehlgeschlagen');
    } finally {
      setRefreshing(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.vorname?.toLowerCase().includes(term) ||
        user.nachname?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term)
      );
    }
    
    if (selectedRole !== 'all') {
      filtered = filtered.filter(user => user.rolle === selectedRole);
    }
    
    if (selectedGender !== 'all') {
      filtered = filtered.filter(user => user.geschlecht === selectedGender);
    }
    
    setFilteredUsers(filtered);
  };

  // ADD NEW PERSON - Backend Integration
  const handleAddPerson = async () => {
    if (!newPerson.vorname || !newPerson.nachname || !newPerson.email || !newPerson.passwort) {
      Alert.alert('Fehler', 'Bitte alle Pflichtfelder ausfüllen');
      return;
    }
    
    try {
      setLoading(true);
      console.log('🔄 Erstelle neuen Nutzer:', newPerson);
      
      await crmService.createUser(newPerson);
      
      // Reset form
      setNewPerson({
        vorname: '',
        nachname: '',
        email: '',
        passwort: '',
        geschlecht: 'männlich',
        rolle: 'Mitglied'
      });
      
      setAddPersonModal(false);
      Alert.alert('Erfolg', 'Person wurde erfolgreich hinzugefügt');
      
      // Reload data
      await loadInitialData();
    } catch (error) {
      console.error('❌ Fehler beim Hinzufügen:', error);
      Alert.alert('Fehler', 'Person konnte nicht hinzugefügt werden: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // EDIT PERSON - Backend Integration
  const handleEditPerson = async () => {
    if (!editPerson.vorname || !editPerson.nachname || !editPerson.email) {
      Alert.alert('Fehler', 'Bitte alle Pflichtfelder ausfüllen');
      return;
    }
    
    try {
      setLoading(true);
      console.log('🔄 Bearbeite Nutzer:', editPerson.id);
      
      // Entferne leeres Passwort aus Update
      const updateData = { ...editPerson };
      if (!updateData.passwort) {
        delete updateData.passwort;
      }
      
      await crmService.updateUser(editPerson.id, updateData);
      
      setEditUserModal(false);
      setUserDetailModal(false);
      Alert.alert('Erfolg', 'Person wurde erfolgreich aktualisiert');
      
      // Reload data
      await loadInitialData();
    } catch (error) {
      console.error('❌ Fehler beim Bearbeiten:', error);
      Alert.alert('Fehler', 'Person konnte nicht bearbeitet werden: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // DELETE USER - Backend Integration
  const handleDeleteUser = async (userId) => {
    Alert.alert(
      'Nutzer löschen',
      'Möchten Sie diesen Nutzer wirklich löschen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { 
          text: 'Löschen', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              console.log('🗑️ Lösche Nutzer:', userId);
              
              await crmService.deleteUser(userId);
              
              Alert.alert('Erfolg', 'Nutzer wurde gelöscht');
              setUserDetailModal(false);
              
              // Reload data
              await loadInitialData();
            } catch (error) {
              console.error('❌ Fehler beim Löschen:', error);
              Alert.alert('Fehler', 'Nutzer konnte nicht gelöscht werden: ' + error.message);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // APPROVE REGISTRATION - Backend Integration
  const handleApproveRegistration = async (id) => {
    try {
      setLoading(true);
      console.log('✅ Bestätige Registrierung:', id);
      
      await crmService.approveRegistration(id);
      Alert.alert('Erfolg', 'Registrierung wurde bestätigt');
      
      // Reload data
      await loadInitialData();
    } catch (error) {
      console.error('❌ Fehler beim Bestätigen:', error);
      Alert.alert('Fehler', 'Registrierung konnte nicht bestätigt werden: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // REJECT REGISTRATION - Backend Integration
  const handleRejectRegistration = async (id) => {
    Alert.alert(
      'Registrierung ablehnen',
      'Möchten Sie diese Registrierung wirklich ablehnen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { 
          text: 'Ablehnen', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              console.log('❌ Lehne Registrierung ab:', id);
              
              await crmService.rejectRegistration(id);
              Alert.alert('Erfolg', 'Registrierung wurde abgelehnt');
              
              // Reload data
              await loadInitialData();
            } catch (error) {
              console.error('❌ Fehler beim Ablehnen:', error);
              Alert.alert('Fehler', 'Registrierung konnte nicht abgelehnt werden: ' + error.message);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleEditUser = (user) => {
    setEditPerson({
      id: user.id,
      vorname: user.vorname,
      nachname: user.nachname,
      email: user.email,
      passwort: '',
      geschlecht: user.geschlecht,
      rolle: user.rolle
    });
    setEditUserModal(true);
  };

  const getInitials = (vorname, nachname) => {
    return `${vorname?.[0]?.toUpperCase() || ''}${nachname?.[0]?.toUpperCase() || ''}`;
  };

  const getRoleColor = (rolle) => {
    switch (rolle) {
      case 'Admin': return '#ef4444';
      case 'Trainer': return '#f59e0b';
      case 'Mannschaftsführer': return '#8b5cf6';
      case 'Mitglied': return '#10b981';
      case 'Gast': return '#6b7280';
      default: return '#6b7280';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* LOADING OVERLAY */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#DC143C" />
          <Text style={styles.loadingText}>Lädt...</Text>
        </View>
      )}
      
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CRM System</Text>
      </View>

      {/* CONTENT - WEB-KOMPATIBLES SCROLLING - Einfache ScrollView wie SettingsScreen */}
      <ScrollView 
        style={styles.scrollableContent}
        showsVerticalScrollIndicator={false}
        testID="crm-screen"
      >
        
        {/* SUCHFUNKTION */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Nach Name oder Email suchen..."
            placeholderTextColor="#999"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <Text style={styles.clearButton}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* FILTER */}
        <View style={styles.filterContainer}>
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Rolle:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedRole}
                onValueChange={setSelectedRole}
                style={styles.picker}
              >
                <Picker.Item label="Alle" value="all" />
                {roles.map(role => (
                  <Picker.Item key={role.id} label={role.name} value={role.name} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Geschlecht:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedGender}
                onValueChange={setSelectedGender}
                style={styles.picker}
              >
                <Picker.Item label="Alle" value="all" />
                <Picker.Item label="Männlich" value="männlich" />
                <Picker.Item label="Weiblich" value="weiblich" />
                <Picker.Item label="Divers" value="divers" />
              </Picker>
            </View>
          </View>
        </View>

        {/* MODERNE BUTTONS */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.modernButton, styles.registrationButton]}
            onPress={() => setRegistrationsModal(true)}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="notifications-outline" size={24} color="#f59e0b" style={styles.buttonIcon} />
              <View style={styles.buttonTextContainer}>
                <Text style={styles.buttonTitle}>Registrierungen</Text>
                <Text style={styles.buttonSubtitle}>{pendingRegistrations.length} ausstehend</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.modernButton, styles.refreshButton]}
            onPress={handleRefresh}
            disabled={refreshing}
          >
            <View style={styles.buttonContent}>
              {refreshing ? (
                <ActivityIndicator size="small" color="#6b7280" style={styles.buttonIcon} />
              ) : (
                <Ionicons name="refresh" size={24} color="#6b7280" style={styles.buttonIcon} />
              )}
              <View style={styles.buttonTextContainer}>
                <Text style={styles.buttonTitle}>Aktualisieren</Text>
                <Text style={styles.buttonSubtitle}>Daten neu laden</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.modernButton, styles.addButton]}
            onPress={() => setAddPersonModal(true)}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="person-add" size={24} color="#10b981" style={styles.buttonIcon} />
              <View style={styles.buttonTextContainer}>
                <Text style={styles.buttonTitle}>Person hinzufügen</Text>
                <Text style={styles.buttonSubtitle}>Neues Mitglied</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* STATISTIK KÄSTEN - Backend Daten */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.total || users.length}</Text>
            <Text style={styles.statLabel}>Gesamt</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.pending || pendingRegistrations.length}</Text>
            <Text style={styles.statLabel}>Ausstehend</Text>
          </View>
        </View>

        {/* PERSONEN LISTE */}
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>Mitglieder ({filteredUsers.length})</Text>
          
          {filteredUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Keine Nutzer gefunden</Text>
            </View>
          ) : (
            filteredUsers.map((user) => (
              <TouchableOpacity
                key={user.id}
                style={styles.userCard}
                onPress={() => {
                  setSelectedUser(user);
                  setUserDetailModal(true);
                }}
              >
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>
                    {getInitials(user.vorname, user.nachname)}
                  </Text>
                </View>
                
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>
                    {user.vorname} {user.nachname}
                  </Text>
                  <Text style={styles.userEmail}>{user.email}</Text>
                  <Text style={styles.userMeta}>
                    {user.geschlecht} • {user.rolle}
                  </Text>
                </View>

                <View style={[styles.roleTag, { backgroundColor: getRoleColor(user.rolle) }]}>
                  <Text style={styles.roleTagText}>{user.rolle}</Text>
                </View>

                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* PERSON HINZUFÜGEN MODAL */}
      <Modal
        visible={addPersonModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setAddPersonModal(false)}>
              <Text style={styles.modalCancel}>Abbrechen</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Person hinzufügen</Text>
            <TouchableOpacity onPress={handleAddPerson} disabled={loading}>
              <Text style={[styles.modalSave, loading && styles.disabledText]}>
                {loading ? 'Speichert...' : 'Speichern'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.sectionHeader}>Persönliche Daten</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Vorname *</Text>
              <TextInput
                style={styles.input}
                value={newPerson.vorname}
                onChangeText={(text) => setNewPerson({...newPerson, vorname: text})}
                placeholder="Vorname eingeben"
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nachname *</Text>
              <TextInput
                style={styles.input}
                value={newPerson.nachname}
                onChangeText={(text) => setNewPerson({...newPerson, nachname: text})}
                placeholder="Nachname eingeben"
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>E-Mail Adresse *</Text>
              <TextInput
                style={styles.input}
                value={newPerson.email}
                onChangeText={(text) => setNewPerson({...newPerson, email: text})}
                placeholder="email@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Passwort *</Text>
              <TextInput
                style={styles.input}
                value={newPerson.passwort}
                onChangeText={(text) => setNewPerson({...newPerson, passwort: text})}
                placeholder="Sicheres Passwort eingeben"
                secureTextEntry={true}
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Geschlecht</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={newPerson.geschlecht}
                  onValueChange={(value) => setNewPerson({...newPerson, geschlecht: value})}
                  style={styles.picker}
                  enabled={!loading}
                >
                  <Picker.Item label="Männlich" value="männlich" />
                  <Picker.Item label="Weiblich" value="weiblich" />
                  <Picker.Item label="Divers" value="divers" />
                </Picker>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Rolle</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={newPerson.rolle}
                  onValueChange={(value) => setNewPerson({...newPerson, rolle: value})}
                  style={styles.picker}
                  enabled={!loading}
                >
                  {roles.map(role => (
                    <Picker.Item key={role.id} label={role.name} value={role.name} />
                  ))}
                </Picker>
              </View>
            </View>

            <Text style={styles.sectionHeader}>System-Informationen</Text>
            <Text style={styles.infoText}>
              Die Person wird automatisch aktiviert und kann sich sofort anmelden.
            </Text>
          </ScrollView>
        </View>
      </Modal>

      {/* USER DETAIL MODAL */}
      <Modal
        visible={userDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setUserDetailModal(false)}>
              <Text style={styles.modalCancel}>Schließen</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Mitglied Details</Text>
            <TouchableOpacity onPress={() => handleEditUser(selectedUser)}>
              <Text style={styles.modalSave}>Bearbeiten</Text>
            </TouchableOpacity>
          </View>

          {selectedUser && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.userDetailHeader}>
                <View style={styles.userDetailAvatar}>
                  <Text style={styles.userDetailAvatarText}>
                    {getInitials(selectedUser.vorname, selectedUser.nachname)}
                  </Text>
                </View>
                <Text style={styles.userDetailName}>
                  {selectedUser.vorname} {selectedUser.nachname}
                </Text>
                <View style={[styles.userDetailRole, { backgroundColor: getRoleColor(selectedUser.rolle) }]}>
                  <Text style={styles.userDetailRoleText}>{selectedUser.rolle}</Text>
                </View>
              </View>

              <Text style={styles.sectionHeader}>Persönliche Daten</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Vorname:</Text>
                <Text style={styles.detailValue}>{selectedUser.vorname}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Nachname:</Text>
                <Text style={styles.detailValue}>{selectedUser.nachname}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>E-Mail:</Text>
                <Text style={styles.detailValue}>{selectedUser.email}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Geschlecht:</Text>
                <Text style={styles.detailValue}>{selectedUser.geschlecht}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Rolle:</Text>
                <Text style={styles.detailValue}>{selectedUser.rolle}</Text>
              </View>

              <Text style={styles.sectionHeader}>System-Informationen</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Mitglieds-ID:</Text>
                <Text style={styles.detailValue}>{selectedUser.id}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <Text style={[styles.detailValue, { color: '#10b981' }]}>Aktiv</Text>
              </View>

              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => handleDeleteUser(selectedUser.id)}
              >
                <Text style={styles.deleteButtonText}>Nutzer löschen</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* EDIT USER MODAL */}
      <Modal
        visible={editUserModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditUserModal(false)}>
              <Text style={styles.modalCancel}>Abbrechen</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Person bearbeiten</Text>
            <TouchableOpacity onPress={handleEditPerson} disabled={loading}>
              <Text style={[styles.modalSave, loading && styles.disabledText]}>
                {loading ? 'Speichert...' : 'Speichern'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.sectionHeader}>Persönliche Daten</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Vorname *</Text>
              <TextInput
                style={styles.input}
                value={editPerson.vorname}
                onChangeText={(text) => setEditPerson({...editPerson, vorname: text})}
                placeholder="Vorname eingeben"
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nachname *</Text>
              <TextInput
                style={styles.input}
                value={editPerson.nachname}
                onChangeText={(text) => setEditPerson({...editPerson, nachname: text})}
                placeholder="Nachname eingeben"
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>E-Mail Adresse *</Text>
              <TextInput
                style={styles.input}
                value={editPerson.email}
                onChangeText={(text) => setEditPerson({...editPerson, email: text})}
                placeholder="email@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Neues Passwort (optional)</Text>
              <TextInput
                style={styles.input}
                value={editPerson.passwort}
                onChangeText={(text) => setEditPerson({...editPerson, passwort: text})}
                placeholder="Neues Passwort (leer lassen um beizubehalten)"
                secureTextEntry={true}
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Geschlecht</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={editPerson.geschlecht}
                  onValueChange={(value) => setEditPerson({...editPerson, geschlecht: value})}
                  style={styles.picker}
                  enabled={!loading}
                >
                  <Picker.Item label="Männlich" value="männlich" />
                  <Picker.Item label="Weiblich" value="weiblich" />
                  <Picker.Item label="Divers" value="divers" />
                </Picker>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Rolle</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={editPerson.rolle}
                  onValueChange={(value) => setEditPerson({...editPerson, rolle: value})}
                  style={styles.picker}
                  enabled={!loading}
                >
                  {roles.map(role => (
                    <Picker.Item key={role.id} label={role.name} value={role.name} />
                  ))}
                </Picker>
              </View>
            </View>

            <Text style={styles.sectionHeader}>System-Informationen</Text>
            <Text style={styles.infoText}>
              Änderungen werden sofort übernommen und die Person wird benachrichtigt.
            </Text>
          </ScrollView>
        </View>
      </Modal>

      {/* REGISTRIERUNGEN MODAL - Backend Daten */}
      <Modal
        visible={registrationsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View />
            <Text style={styles.modalTitle}>Neue Registrierungen</Text>
            <TouchableOpacity onPress={() => setRegistrationsModal(false)}>
              <Text style={styles.modalCancel}>Schließen</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.registrationInfo}>
              {pendingRegistrations.length} neue Registrierungen warten auf Bestätigung:
            </Text>

            {pendingRegistrations.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>Keine ausstehenden Registrierungen</Text>
              </View>
            ) : (
              pendingRegistrations.map((registration) => (
                <View key={registration.id} style={styles.pendingCard}>
                  <View style={styles.pendingHeader}>
                    <View style={styles.pendingAvatar}>
                      <Text style={styles.pendingAvatarText}>
                        {getInitials(registration.vorname, registration.nachname)}
                      </Text>
                    </View>
                    <View style={styles.pendingInfo}>
                      <Text style={styles.pendingName}>
                        {registration.vorname} {registration.nachname}
                      </Text>
                      <Text style={styles.pendingEmail}>{registration.email}</Text>
                      <Text style={styles.pendingMeta}>
                        {registration.geschlecht} • {registration.created_at ? new Date(registration.created_at).toLocaleDateString('de-DE') : 'Heute'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.pendingActions}>
                    <TouchableOpacity 
                      style={styles.approveButton}
                      onPress={() => handleApproveRegistration(registration.id)}
                      disabled={loading}
                    >
                      <Text style={styles.approveButtonText}>✓ Bestätigen</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.rejectButton}
                      onPress={() => handleRejectRegistration(registration.id)}
                      disabled={loading}
                    >
                      <Text style={styles.rejectButtonText}>✕ Ablehnen</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
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
  
  // LOADING OVERLAY
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
  
  // Simple Clean Header
  header: {
    backgroundColor: '#fff',
    paddingTop: 20, // Safe area padding
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
  },

  // CONTENT - WEB-KOMPATIBLES SCROLLING - EXAKT wie SettingsScreen
  scrollableContent: {
    flex: 1,
    padding: 20,
    paddingBottom: 100,     // ✅ Platz für Bottom Tab Bar
    height: '70vh',         // ✅ Feste Höhe für Web
    overflow: 'auto',       // ✅ Eigenes Scrolling
    maxHeight: '90vh',      // ✅ Max-Height Begrenzung
  },

  // EMPTY STATE
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },

  // DELETE BUTTON
  deleteButton: {
    backgroundColor: '#ef4444',
    padding: 15,
    borderRadius: 8,
    marginTop: 30,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // DISABLED TEXT
  disabledText: {
    color: '#ccc',
  },

  // SEARCH
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
    alignSelf: 'center',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    fontSize: 16,
    color: '#666',
    padding: 5,
  },

  // FILTER
  filterContainer: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
  },
  filterItem: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  picker: {
    height: 45,
  },

  // MODERNE BUTTONS
  buttonContainer: {
    gap: 15,
    marginBottom: 25,
  },
  modernButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderLeftWidth: 4,
  },
  registrationButton: {
    borderLeftColor: '#f59e0b',
  },
  refreshButton: {
    borderLeftColor: '#6b7280',
  },
  addButton: {
    borderLeftColor: '#10b981',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: {
    marginRight: 15,
    alignSelf: 'center',
  },
  buttonTextContainer: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  buttonSubtitle: {
    fontSize: 14,
    color: '#666',
  },

  // STATS
  statsContainer: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#DC143C',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },

  // LIST
  listSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userAvatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#DC143C',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  userMeta: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  roleTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 10,
  },
  roleTagText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  chevron: {
    fontSize: 18,
    color: '#ccc',
  },

  // MODAL
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCancel: {
    fontSize: 16,
    color: '#666',
  },
  modalSave: {
    fontSize: 16,
    color: '#DC143C',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },

  // USER DETAIL
  userDetailHeader: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 20,
  },
  userDetailAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#DC143C',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  userDetailAvatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userDetailName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  userDetailRole: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  userDetailRoleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    width: 100,
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },

  // REGISTRATIONS
  registrationInfo: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  pendingCard: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fed7aa',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  pendingHeader: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  pendingAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  pendingAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  pendingInfo: {
    flex: 1,
  },
  pendingName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  pendingEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  pendingMeta: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  pendingActions: {
    flexDirection: 'row',
    gap: 10,
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CRMScreen;