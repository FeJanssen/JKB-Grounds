import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ScrollView,
  Switch,
} from 'react-native';

const BookingModal = ({ 
  visible, 
  onClose, 
  court, 
  selectedDate, 
  selectedTime, 
  onConfirmBooking,
  canBookPublic = false,  // ✅ Permission-Prop
  vereinId = null,  // ✅ Dynamische Verein-ID
  userId = null  // ✅ NEU: Dynamische User-ID
}) => {
  const [duration, setDuration] = useState('60');
  const [isPublic, setIsPublic] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const calculateEndTime = (startTime, durationMinutes) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + parseInt(durationMinutes);
    const endHours = Math.floor(totalMinutes / 60);
    const endMins = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  };

  const handleConfirm = async () => {
    try {
      // ✅ VALIDIERUNG: User-ID muss vorhanden sein
      if (!userId) {
        Alert.alert('Fehler', 'Keine gültige Benutzer-ID gefunden. Bitte neu einloggen.');
        return;
      }
      
      // ✅ VALIDIERUNG: Verein-ID muss vorhanden sein
      if (!vereinId) {
        Alert.alert('Fehler', 'Keine gültige Vereins-ID gefunden.');
        return;
      }
      
      // ✅ PERMISSION CHECK VOR BUCHUNG
      if (isPublic && !canBookPublic) {
        Alert.alert(
          'Keine Berechtigung', 
          'Sie haben keine Berechtigung für öffentliche Buchungen.'
        );
        return;
      }

      if (!duration || parseInt(duration) <= 0) {
        Alert.alert('Fehler', 'Bitte geben Sie eine gültige Dauer ein.');
        return;
      }

      setLoading(true);

      // ✅ KORREKTE API-STRUKTUR mit dynamischer Verein-ID
      const bookingData = {
        platz_id: court.id,  // ✅ Korrigiert: platz_id statt court_id (Backend erwartet platz_id)
        date: selectedDate, // ✅ Sollte bereits im Format YYYY-MM-DD sein
        time: selectedTime, // ✅ Änderung: Ohne :00 (Backend fügt das hinzu)
        duration: parseInt(duration),
        type: isPublic ? 'public' : 'private', // ✅ DYNAMISCH: Abhängig vom Toggle
        notes: notes || ''  // ✅ Leerer String falls keine Notizen
      };

      console.log('📤 BookingModal: FINALE Buchungsdaten:', JSON.stringify(bookingData, null, 2));
      console.log('📤 BookingModal: User-ID:', userId);
      console.log('📤 BookingModal: Verein-ID:', vereinId);

      await onConfirmBooking(bookingData);
      onClose();
      
      // Reset Form
      setDuration('60');
      setIsPublic(false);
      setNotes('');
      
    } catch (error) {
      Alert.alert('Buchungsfehler', error.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Automatisch private setzen wenn keine öffentliche Berechtigung
  React.useEffect(() => {
    if (!canBookPublic && isPublic) {
      setIsPublic(false);
    }
  }, [canBookPublic]);

  if (!court) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Platz buchen</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Buchungsdetails */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Buchungsdetails</Text>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Platz:</Text>
                <Text style={styles.infoValue}>{court.name}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Datum:</Text>
                <Text style={styles.infoValue}>{selectedDate}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Startzeit:</Text>
                <Text style={styles.infoValue}>{selectedTime}</Text>
              </View>

              {duration && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Endzeit:</Text>
                  <Text style={styles.infoValue}>
                    {calculateEndTime(selectedTime, duration)}
                  </Text>
                </View>
              )}
            </View>

            {/* Dauer */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Spieldauer</Text>
              <View style={styles.durationSelector}>
                {['30', '60', '90', '120'].map((mins) => (
                  <TouchableOpacity
                    key={mins}
                    style={[
                      styles.durationButton,
                      duration === mins && styles.activeDurationButton
                    ]}
                    onPress={() => setDuration(mins)}
                  >
                    <Text style={[
                      styles.durationButtonText,
                      duration === mins && styles.activeDurationButtonText
                    ]}>
                      {mins} Min.
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Buchungsart mit Permission-Check */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Buchungsart</Text>
              
              <View style={styles.switchContainer}>
                <View style={styles.switchOption}>
                  <View>
                    <Text style={styles.switchLabel}>
                      {isPublic ? '🌍 Öffentliche Buchung' : '🔒 Private Buchung'}
                    </Text>
                    <Text style={styles.switchDescription}>
                      {isPublic 
                        ? 'Für alle Vereinsmitglieder sichtbar - andere können beitreten'
                        : 'Nur für Sie sichtbar - private Buchung'
                      }
                    </Text>
                    {/* ✅ PERMISSION HINWEIS */}
                    {!canBookPublic && (
                      <Text style={styles.permissionWarning}>
                        ⚠️ Keine Berechtigung für öffentliche Buchungen
                      </Text>
                    )}
                  </View>
                  <Switch
                    value={isPublic}
                    onValueChange={(value) => {
                      // ✅ PERMISSION CHECK beim Switch
                      if (value && !canBookPublic) {
                        Alert.alert(
                          'Keine Berechtigung',
                          'Sie haben keine Berechtigung für öffentliche Buchungen.'
                        );
                        return;
                      }
                      setIsPublic(value);
                    }}
                    trackColor={{ 
                      false: '#ccc', 
                      true: canBookPublic ? '#2E8B57' : '#ccc'  // ✅ Disabled Color
                    }}
                    thumbColor={'#fff'}
                    disabled={!canBookPublic}  // ✅ Switch deaktiviert wenn keine Berechtigung
                  />
                </View>
              </View>
            </View>

            {/* Notizen */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notizen (optional)</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Zusätzliche Informationen, Mitspieler, etc..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Abbrechen</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.confirmButton, loading && styles.disabledButton]} 
              onPress={handleConfirm}
              disabled={loading}
            >
              <Text style={styles.confirmButtonText}>
                {loading ? 'Wird gebucht...' : '🎾 Jetzt buchen'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    maxHeight: 400,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  durationSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  durationButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  activeDurationButton: {
    backgroundColor: '#2E8B57',
    borderColor: '#2E8B57',
  },
  durationButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  activeDurationButtonText: {
    color: '#fff',
  },
  switchContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
  },
  switchOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
    maxWidth: '80%',
  },
  permissionWarning: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: 'bold',
    marginTop: 4,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    minHeight: 80,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 10,
    borderRadius: 8,
    backgroundColor: '#2E8B57',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
});

export default BookingModal;