import React, { useState, useEffect } from 'react';
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
  
  // ✅ NEU: COLOR-PICKER für öffentliche Buchungen
  const [selectedBookingColor, setSelectedBookingColor] = useState('#4CAF50'); // Default grün
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  // ✅ Verfügbare Farben für öffentliche Buchungen
  const bookingColors = [
    { name: 'Grün', value: '#4CAF50' },
    { name: 'Blau', value: '#2196F3' },
    { name: 'Orange', value: '#FF9800' },
    { name: 'Lila', value: '#9C27B0' },
    { name: 'Türkis', value: '#009688' },
    { name: 'Indigo', value: '#3F51B5' },
    { name: 'Pink', value: '#E91E63' },
    { name: 'Braun', value: '#795548' },
    { name: 'Grau', value: '#607D8B' },
    { name: 'Gelb', value: '#FFEB3B' }
  ];
  
  // ✅ SERIEN-BUCHUNG STATES
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringWeeks, setRecurringWeeks] = useState(8); // Default 8 Wochen

  // ✅ Setze Standarddauer basierend auf verfügbaren Buchungszeiten
  useEffect(() => {
    if (court?.buchungszeiten && court.buchungszeiten.length > 0) {
      // Wenn 60 Minuten verfügbar ist, nutze das, ansonsten die erste verfügbare Zeit
      const availableTimes = court.buchungszeiten;
      const defaultTime = availableTimes.includes(60) ? '60' : availableTimes[0].toString();
      setDuration(defaultTime);
    }
  }, [court?.buchungszeiten]);

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

      // ✅ KORREKTE API-STRUKTUR mit SERIEN-BUCHUNG
      const bookingData = {
        platz_id: court.id,  // ✅ Korrigiert: platz_id statt court_id (Backend erwartet platz_id)
        date: selectedDate, // ✅ Sollte bereits im Format YYYY-MM-DD sein
        time: selectedTime, // ✅ Änderung: Ohne :00 (Backend fügt das hinzu)
        duration: parseInt(duration),
        type: isPublic ? 'public' : 'private', // ✅ DYNAMISCH: Abhängig vom Toggle
        notes: notes || '',  // ✅ Leerer String falls keine Notizen
        // ✅ NEU: Farbe für öffentliche Buchungen
        ...(isPublic && { color: selectedBookingColor }),
        // ✅ SERIEN-BUCHUNG INFO - Bei aktivierter Serien-Buchung (private UND public)
        ...(isRecurring && {
          is_recurring: true,
          recurring_weeks: recurringWeeks,
          series_name: `${court.name} - ${getWeekdayName(selectedDate)} Training`
        })
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
      setIsRecurring(false);
      setRecurringWeeks(8);
      
    } catch (error) {
      Alert.alert('Buchungsfehler', error.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ HILFSFUNKTIONEN für Serien-Buchung
  const calculateEndDate = (startDate, weeks) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + (weeks - 1) * 7);
    return date.toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getWeekdayName = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', { weekday: 'long' });
  };

  // ✅ Automatisch private setzen wenn keine öffentliche Berechtigung
  React.useEffect(() => {
    if (!canBookPublic && isPublic) {
      setIsPublic(false);
    }
  }, [canBookPublic]);

  // ✅ Reset Serien-Buchung wenn Modal schließt
  React.useEffect(() => {
    if (!visible) {
      setIsRecurring(false);
      setRecurringWeeks(8);
    }
  }, [visible]);

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
                {(court?.buchungszeiten || [30, 60, 90, 120]).map((mins) => (
                  <TouchableOpacity
                    key={mins}
                    style={[
                      styles.durationButton,
                      duration === mins.toString() && styles.activeDurationButton
                    ]}
                    onPress={() => setDuration(mins.toString())}
                  >
                    <Text style={[
                      styles.durationButtonText,
                      duration === mins.toString() && styles.activeDurationButtonText
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
                  <View style={styles.switchTextContainer}>
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
                  <View style={styles.switchWrapper}>
                    <Switch
                      key={`switch-${isPublic}-${canBookPublic}`}  // ✅ FIX: Zwingt Re-render
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
            </View>

            {/* ✅ COLOR-PICKER - Nur bei öffentlicher Buchung */}
            {isPublic && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🎨 Buchungsfarbe</Text>
                <Text style={styles.subscriptionInfo}>
                  Wähle eine Farbe für diese öffentliche Buchung
                </Text>
                
                <TouchableOpacity 
                  style={styles.colorPickerButton}
                  onPress={() => setShowColorPicker(!showColorPicker)}
                >
                  <View style={[styles.colorIndicator, { backgroundColor: selectedBookingColor }]} />
                  <Text style={styles.colorPickerText}>Farbe auswählen</Text>
                </TouchableOpacity>

                {showColorPicker && (
                  <View style={styles.colorGrid}>
                    {bookingColors.map((color) => (
                      <TouchableOpacity
                        key={color.value}
                        style={[
                          styles.colorOption,
                          { backgroundColor: color.value },
                          selectedBookingColor === color.value && styles.selectedColorOption
                        ]}
                        onPress={() => {
                          setSelectedBookingColor(color.value);
                          setShowColorPicker(false);
                        }}
                      >
                        {selectedBookingColor === color.value && (
                          <Text style={styles.colorOptionCheck}>✓</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* ✅ SERIEN-BUCHUNG (ABO) - Nur bei öffentlicher Buchung */}
            {isPublic && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>� Serien-Buchung (Abo)</Text>
                <Text style={styles.subscriptionInfo}>
                  Buchung automatisch jede Woche wiederholen
                </Text>
                
                {/* Abo aktivieren/deaktivieren */}
                <View style={styles.switchContainer}>
                  <View style={styles.switchOption}>
                    <View style={styles.switchTextContainer}>
                      <Text style={styles.switchLabel}>
                        {isRecurring ? '🔄 Serien-Buchung' : '📅 Einzelbuchung'}
                      </Text>
                      <Text style={styles.switchDescription}>
                        {isRecurring 
                          ? 'Automatische wöchentliche Wiederholung'
                          : 'Nur einmalige Buchung'
                        }
                      </Text>
                    </View>
                    <View style={styles.switchWrapper}>
                      <Switch
                        value={isRecurring}
                        onValueChange={setIsRecurring}
                        trackColor={{ false: '#ccc', true: '#2E8B57' }}
                        thumbColor={'#fff'}
                      />
                    </View>
                  </View>
                </View>

                {/* Abo-Details nur wenn aktiviert */}
                {isRecurring && (
                  <View style={styles.recurringDetails}>
                    <Text style={styles.recurringTitle}>📋 Abo-Details</Text>
                    
                    {/* Anzahl Wochen */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Wie viele Wochen?</Text>
                      <View style={styles.weekOptions}>
                        {[4, 8, 12, 16, 20, 24, 28].map((weeks) => (
                          <TouchableOpacity
                            key={weeks}
                            style={[
                              styles.weekOption,
                              recurringWeeks === weeks && styles.weekOptionSelected
                            ]}
                            onPress={() => setRecurringWeeks(weeks)}
                          >
                            <Text style={[
                              styles.weekOptionText,
                              recurringWeeks === weeks && styles.weekOptionTextSelected
                            ]}>
                              {weeks} Wochen
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Enddatum anzeigen */}
                    {recurringWeeks > 0 && (
                      <View style={styles.endDateInfo}>
                        <Text style={styles.endDateLabel}>📅 Letzter Termin:</Text>
                        <Text style={styles.endDateValue}>
                          {calculateEndDate(selectedDate, recurringWeeks)}
                        </Text>
                      </View>
                    )}

                    {/* Zusammenfassung */}
                    <View style={styles.recurringSummary}>
                      <Text style={styles.summaryTitle}>📊 Zusammenfassung</Text>
                      <Text style={styles.summaryText}>
                        • {recurringWeeks} Termine insgesamt
                      </Text>
                      <Text style={styles.summaryText}>
                        • Jeden {getWeekdayName(selectedDate)} um {selectedTime}
                      </Text>
                      <Text style={styles.summaryText}>
                        • Platz: {court.name}
                      </Text>
                      <Text style={styles.summaryText}>
                        • Dauer: {duration} Min. pro Termin
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}

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
  switchTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  switchWrapper: {
    minWidth: 50,
    alignItems: 'flex-end',
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
  
  // ✅ SERIEN-BUCHUNG STYLES
  subscriptionInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  recurringDetails: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  recurringTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  weekOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  weekOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  weekOptionSelected: {
    backgroundColor: '#DC143C',
    borderColor: '#DC143C',
  },
  weekOptionText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  weekOptionTextSelected: {
    color: '#fff',
  },
  endDateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  endDateLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 8,
  },
  endDateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  recurringSummary: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },

  // ✅ COLOR-PICKER STYLES
  colorPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 12,
  },
  colorIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  colorPickerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: 4,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  selectedColorOption: {
    borderWidth: 3,
    borderColor: '#333',
  },
  colorOptionCheck: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
});

export default BookingModal;