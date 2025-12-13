import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  Switch,
} from 'react-native';
import { PermissionContext } from '../context/PermissionContext';
import BookingModal from './BookingModal';
import { buildApiUrl, API_ENDPOINTS, APP_CONFIG } from '../config/constants';

const BookingCalendar = ({ 
  courts = [], 
  canBookPublic = false, 
  vereinId = null, 
  userId = null,
  selectedDate = new Date() // ✅ selectedDate als Prop empfangen
}) => {
  // selectedDate wird jetzt von außen gesteuert
  const [viewMode, setViewMode] = useState('day');
  const [timeSlots, setTimeSlots] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookings, setBookings] = useState([]); // ✅ Immer als Array initialisiert
  const [courtStartIndex, setCourtStartIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [renderKey, setRenderKey] = useState(0); // ✅ Force Re-Render

  // ✅ SICHERE BUCHUNGEN-SETZUNG
  const setSafeBookings = (data) => {
    console.log('🔧 setSafeBookings aufgerufen mit:', data);
    
    if (Array.isArray(data)) {
      console.log('✅ Data ist bereits ein Array mit', data.length, 'Buchungen');
      setBookings(data);
    } else if (data && Array.isArray(data.bookings)) {
      console.log('✅ Data.bookings ist ein Array mit', data.bookings.length, 'Buchungen');
      setBookings(data.bookings);
    } else if (data && data.data && Array.isArray(data.data)) {
      console.log('✅ Data.data ist ein Array mit', data.data.length, 'Buchungen');
      setBookings(data.data);
    } else {
      console.error('❌ Buchungen sind kein Array:', typeof data, data);
      setBookings([]);
    }
  };  const COURTS_PER_VIEW = 3;
  const visibleCourts = courts.slice(courtStartIndex, courtStartIndex + COURTS_PER_VIEW);

  const goToPreviousCourts = () => {
    if (courtStartIndex > 0) {
      setCourtStartIndex(courtStartIndex - 1);
    }
  };

  const goToNextCourts = () => {
    if (courtStartIndex + COURTS_PER_VIEW < courts.length) {
      setCourtStartIndex(courtStartIndex + 1);
    }
  };

  const canShowPreviousCourts = courtStartIndex > 0;
  const canShowNextCourts = courtStartIndex + COURTS_PER_VIEW < courts.length;

  useEffect(() => {
    if (courts.length > 0) {
      generateTimeSlots();
    }
  }, [courts]);

  useEffect(() => {
    if (selectedDate && vereinId) {
      loadBookingsForDate(selectedDate);
    }
  }, [selectedDate, vereinId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookingsForDate(selectedDate);
    setRefreshing(false);
  };

  const generateTimeSlots = () => {
    const slots = [];
    let earliestHour = 7;
    let latestHour = 22;

    // Buchbare Zeiten aus Courts ermitteln
    if (courts && courts.length > 0) {
      courts.forEach(court => {
        if (court.buchbar_von) {
          const startHour = parseInt(court.buchbar_von.split(':')[0]);
          earliestHour = Math.min(earliestHour, startHour);
        }
        if (court.buchbar_bis) {
          const endHour = parseInt(court.buchbar_bis.split(':')[0]);
          latestHour = Math.max(latestHour, endHour);
        }
      });
    }
    
    console.log(`Generiere Zeitslots von ${earliestHour}:00 bis ${latestHour}:00`);
    
    for (let hour = earliestHour; hour <= latestHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    setTimeSlots(slots);
  };

  const isTimeSlotBookable = (court, timeSlot) => {
    if (court.buchbar_von && court.buchbar_bis) {
      const slotTime = timeSlot + ':00';
      return slotTime >= court.buchbar_von && slotTime <= court.buchbar_bis;
    }
    return true;
  };

  const loadBookingsForDate = async (date) => {
    try {
      const dateString = formatDateForAPI(date);
      console.log('Lade Buchungen für:', dateString, 'Verein:', vereinId);
      
      if (!vereinId) {
        console.log('❌ Keine Verein-ID vorhanden, überspringe Buchungsladen');
        return;
      }

      const response = await fetch(buildApiUrl(API_ENDPOINTS.BOOKINGS.BY_DATE(dateString, vereinId)));
      
      console.log('📡 API Response Status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📋 Rohe API-Antwort:', data);
        console.log('📋 API-Antwort Typ:', typeof data);
        console.log('📋 Ist Array?', Array.isArray(data));
        
        // ✅ SICHERE BUCHUNGEN-SETZUNG
        setSafeBookings(data);
        
        // Zusätzliches Logging nach dem Setzen
        setTimeout(() => {
          console.log('🔄 Nach setSafeBookings - aktueller bookings state:', bookings);
        }, 100);
        
      } else {
        console.error('❌ Fehler beim Laden der Buchungen:', response.status);
        setSafeBookings([]);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Buchungen:', error);
      setSafeBookings([]);
    }
  };

  const isTimeSlotBooked = (courtId, timeSlot) => {
    // ✅ SICHERHEITSCHECK: bookings muss ein Array sein
    if (!Array.isArray(bookings)) {
      console.log('⚠️ bookings ist kein Array:', typeof bookings, bookings);
      return false;
    }
    
    console.log(`🔍 Prüfe Zeitslot ${timeSlot} auf Platz ${courtId}:`);
    console.log(`📋 Verfügbare Buchungen (${bookings.length}):`, bookings);
    
    const isBooked = bookings.some(booking => {
      console.log(`🔎 Prüfe Buchung:`, booking);
      
      if (!booking.uhrzeit_von || !booking.uhrzeit_bis) {
        console.log('❌ Buchung hat keine Zeit-Felder');
        return false;
      }
      
      const bookingStart = booking.uhrzeit_von.substring(0, 5);
      const bookingEnd = booking.uhrzeit_bis.substring(0, 5);
      
      console.log(`⏰ Buchung: ${bookingStart} - ${bookingEnd}, Platz: ${booking.platz_id}`);
      
      const platzMatches = booking.platz_id === courtId || booking.platz_id == courtId;
      const timeMatches = bookingStart <= timeSlot && bookingEnd > timeSlot;
      
      console.log(`🎾 Platz-Match: ${platzMatches} (${booking.platz_id} [${typeof booking.platz_id}] === ${courtId} [${typeof courtId}])`);
      console.log(`⏱️ Zeit-Match: ${timeMatches} (${bookingStart} <= ${timeSlot} < ${bookingEnd})`);
      
      const matches = platzMatches && timeMatches;
      
      if (matches) {
        console.log(`🔒 MATCH! Zeitslot ${timeSlot} auf Platz ${courtId} ist gebucht:`, booking);
      }
      
      return matches;
    });
    
    console.log(`🎯 Endergebnis für ${timeSlot} auf Platz ${courtId}: ${isBooked ? 'GEBUCHT' : 'FREI'}`);
    return isBooked;
  };

  const getBookingInfo = (courtId, timeSlot) => {
    // ✅ SICHERHEITSCHECK: bookings muss ein Array sein
    if (!Array.isArray(bookings)) {
      return null;
    }
    
    return bookings.find(booking => {
      const bookingStart = booking.uhrzeit_von.substring(0, 5);
      const bookingEnd = booking.uhrzeit_bis.substring(0, 5);
      
      return booking.platz_id === courtId && 
             bookingStart <= timeSlot && 
             bookingEnd > timeSlot;
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('de-DE', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateForAPI = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // ✨ NEUE WOCHENSPRUNG-FUNKTIONEN
  const goToPreviousWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 7);
    setSelectedDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 7);
    setSelectedDate(newDate);
  };

  const handleTimeSlotPress = (court, timeSlot) => {
    if (!isTimeSlotBookable(court, timeSlot)) {
      Alert.alert(
        'Nicht buchbar',
        'Dieser Zeitslot ist außerhalb der buchbaren Zeiten für diesen Platz.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (isTimeSlotBooked(court.id, timeSlot)) {
      const bookingInfo = getBookingInfo(court.id, timeSlot);
      Alert.alert(
        'Bereits gebucht',
        `Dieser Platz ist von ${bookingInfo.uhrzeit_von} bis ${bookingInfo.uhrzeit_bis} gebucht.`,
        [{ text: 'OK' }]
      );
      return;
    }

    setSelectedBooking({
      court: court,
      date: formatDateForAPI(selectedDate),
      time: timeSlot,
      displayDate: formatDate(selectedDate)
    });
    setModalVisible(true);
  };

  const handleConfirmBooking = async (bookingData) => {
    try {
      console.log('🚀 Sende Buchungsdaten:', JSON.stringify(bookingData, null, 2));
      
      // ✅ Validierung: User-ID muss vorhanden sein
      if (!userId) {
        throw new Error('Keine gültige Benutzer-ID gefunden. Bitte neu einloggen.');
      }
      
      // ✅ SERIEN-BUCHUNG vs EINZEL-BUCHUNG: Wähle richtige API Route
      const isSeriesBooking = bookingData.is_recurring === true;
      const endpoint = isSeriesBooking ? API_ENDPOINTS.BOOKINGS.SERIES : API_ENDPOINTS.BOOKINGS.CREATE;
      
      console.log(`📍 ${isSeriesBooking ? 'SERIEN-BUCHUNG' : 'EINZEL-BUCHUNG'} detected - using endpoint: ${endpoint}`);
      
      // ✅ Bei Serien-Buchung: Datenstruktur anpassen
      let requestData = bookingData;
      if (isSeriesBooking) {
        requestData = {
          platz_id: bookingData.platz_id,
          start_date: bookingData.date,  // ✅ date -> start_date für Series API
          time: bookingData.time,
          duration: bookingData.duration,
          type: bookingData.type,
          notes: bookingData.notes,
          weeks: bookingData.recurring_weeks,
          series_name: bookingData.series_name
        };
        console.log('🎯 SERIEN-BUCHUNG: Angepasste Datenstruktur:', JSON.stringify(requestData, null, 2));
      }
      
      const response = await fetch(buildApiUrl(endpoint), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userId  // ✅ Dynamische User-ID verwenden
        },
        body: JSON.stringify(requestData)
      });
      
      const data = await response.json();
      console.log('Backend Response Status:', response.status);
      console.log('Backend Response Data:', data);
      
      if (response.ok && data.status === 'success') {
        // ✅ SOFORTIGES NEULADEN der Buchungen
        console.log('✅ Buchung erfolgreich, lade Buchungen neu...');
        await loadBookingsForDate(selectedDate);
        
        // ✅ UNTERSCHIEDLICHE SUCCESS-NACHRICHTEN
        if (isSeriesBooking && data.summary) {
          Alert.alert(
            'Serien-Buchung erfolgreich!',
            `${data.summary.successful} von ${data.summary.total} Buchungen erstellt.\n\n` +
            `Serie: ${data.series_info.name}\n` +
            `Zeitraum: ${data.series_info.weeks} Wochen\n` +
            `Start: ${data.series_info.start_date}` +
            (data.summary.failed > 0 ? `\n\n⚠️ ${data.summary.failed} Termine konnten nicht gebucht werden (bereits belegt).` : ''),
            [{ 
              text: 'OK', 
              onPress: () => {
                console.log('✅ Serien-Buchung Dialog OK gedrückt, lade Buchungen neu...');
                loadBookingsForDate(selectedDate);
              }
            }]
          );
        } else {
          Alert.alert(
            'Buchung erfolgreich!',
            `Platz wurde für ${bookingData.date} um ${bookingData.time} gebucht.`,
            [{ 
              text: 'OK', 
              onPress: () => {
                // Nochmal laden zur Sicherheit
                console.log('✅ Dialog OK gedrückt, lade nochmal...');
                loadBookingsForDate(selectedDate);
              }
            }]
          );
        }
      } else {
        // ✅ BESSERE FEHLERBEHANDLUNG für 422
        let errorMessage = 'Buchung fehlgeschlagen';
        if (response.status === 422) {
          // Validation errors sind oft Arrays
          if (Array.isArray(data.detail)) {
            errorMessage = data.detail.map(err => err.msg || err.message || JSON.stringify(err)).join(', ');
          } else if (Array.isArray(data)) {
            errorMessage = data.map(err => err.msg || err.message || JSON.stringify(err)).join(', ');
          } else {
            errorMessage = data.detail || data.message || 'Ungültige Buchungsdaten. Bitte prüfen Sie Ihre Eingaben.';
          }
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (data.message) {
          errorMessage = data.message;
        }
        
        console.error('❌ Buchungsfehler (Status ' + response.status + '):', errorMessage);
        console.error('❌ Raw Server Response:', JSON.stringify(data, null, 2));
        throw new Error(errorMessage);
      }
      
    } catch (error) {
      console.error('Buchungsfehler:', error);
      throw new Error(error.message || 'Buchung fehlgeschlagen');
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedBooking(null);
  };

  return (
    <View style={styles.container} key={renderKey}>
      {/* ✅ Navigation wurde ins BookingScreen verschoben */}
      
      {/* Calendar Grid */}
      <View style={styles.calendarContainer}>
        {/* Header Row with Court Names */}
        <View style={styles.headerRow}>
          <View style={styles.timeHeaderCell}>
            <Text style={styles.timeHeaderText}>Zeit</Text>
          </View>
          {visibleCourts.map((court) => (
            <View key={court.id} style={styles.courtHeaderCell}>
              <Text style={styles.courtHeaderText}>{court.name}</Text>
              <Text style={styles.courtSubText}>{court.platztyp}</Text>
            </View>
          ))}
        </View>

        {/* Time Rows */}
        {timeSlots.map((timeSlot) => (
          <View key={timeSlot} style={styles.timeRow}>
            <View style={styles.timeCell}>
              <Text style={styles.timeText}>{timeSlot}</Text>
            </View>
            {visibleCourts.map((court) => {
              const isBooked = isTimeSlotBooked(court.id, timeSlot);
              const isBookable = isTimeSlotBookable(court, timeSlot);
              const bookingInfo = isBooked ? getBookingInfo(court.id, timeSlot) : null;
              
              // Debug-Logging für Buchungsinfo
              if (isBooked && bookingInfo) {
                console.log('🔍 BookingInfo für', timeSlot, ':', {
                  buchungstyp: bookingInfo.buchungstyp,
                  notizen: bookingInfo.notizen,
                  fullBooking: bookingInfo
                });
              }
              
              // Bestimme den anzuzeigenden Text
              let displayText = 'Frei';
              if (!isBookable) {
                displayText = 'Gesperrt';
              } else if (isBooked && bookingInfo) {
                // Wenn öffentlich (buchungstyp === 'public') und Notizen vorhanden, zeige Notizen
                if (bookingInfo.buchungstyp === 'public' && bookingInfo.notizen) {
                  console.log('✅ Zeige Notizen für öffentliche Buchung:', bookingInfo.notizen);
                  displayText = bookingInfo.notizen;
                } else {
                  console.log('⚠️ Zeige "Gebucht" - buchungstyp:', bookingInfo.buchungstyp, 'notizen:', bookingInfo.notizen);
                  displayText = 'Gebucht';
                }
              }
              
              return (
                <TouchableOpacity
                  key={`${court.id}-${timeSlot}`}
                  style={[
                    styles.bookingCell,
                    isBooked && styles.bookedCell,
                    !isBookable && styles.notBookableCell
                  ]}
                  onPress={() => handleTimeSlotPress(court, timeSlot)}
                  disabled={isBooked || !isBookable}
                >
                  <Text 
                    style={[
                      styles.bookingCellText,
                      isBooked && styles.bookedCellText,
                      !isBookable && styles.notBookableCellText
                    ]}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {displayText}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, styles.freeColor]} />
            <Text style={styles.legendText}>Frei</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, styles.bookedColor]} />
            <Text style={styles.legendText}>Gebucht</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, styles.blockedColor]} />
            <Text style={styles.legendText}>Gesperrt</Text>
          </View>
        </View>
        <Text style={styles.footerHint}>
          Tipp: Ziehen Sie nach unten, um die Buchungen zu aktualisieren
        </Text>
      </View>

      {/* Booking Modal */}
      <BookingModal
        visible={modalVisible}
        onClose={closeModal}
        court={selectedBooking?.court}
        selectedDate={selectedBooking?.date}
        selectedTime={selectedBooking?.time}
        onConfirmBooking={handleConfirmBooking}
        canBookPublic={canBookPublic}
        vereinId={vereinId}
        userId={userId}  // ✅ User-ID an Modal weiterleiten
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    // Entfernt: flex: 1 - der parent ScrollView managed das scrolling
  },
  permissionHeader: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  permissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  permissionItem: {
    fontSize: 14,
    color: '#666',
  },
  permissionEnabled: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  permissionDisabled: {
    color: '#F44336',
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  dateNavigation: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButton: {
    padding: 10, // Reduziert von 12
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginHorizontal: 3, // Reduziert von 8 auf 3
  },
  navButtonText: {
    fontSize: 16, // Reduziert von 18
    fontWeight: 'bold',
    color: '#333',
  },
  // ✨ NEUE WOCHENSPRUNG-BUTTON STYLES
  weekNavButton: {
    padding: 10, // Reduziert von 12
    backgroundColor: '#DC143C', // Rote Farbe für Wochensprünge
    borderRadius: 8,
    marginHorizontal: 2, // Reduziert von 4 auf 2
    minWidth: 45, // Reduziert von 50
  },
  weekNavButtonText: {
    fontSize: 14, // Reduziert von 16
    fontWeight: 'bold',
    color: '#fff', // Weißer Text auf rotem Hintergrund
    textAlign: 'center',
  },
  dateContainer: {
    paddingVertical: 8,
    paddingHorizontal: 12, // Reduziert von 16
  },
  dateText: {
    fontSize: 16, // Reduziert von 18
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    minWidth: 160, // Reduziert von 200
  },
  content: {
    // Entfernt - wird jetzt vom parent ScrollView verwaltet
  },
  courtNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  courtNavButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#2E8B57',
    borderRadius: 6,
  },
  courtNavButtonDisabled: {
    backgroundColor: '#ccc',
  },
  courtNavButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  courtNavInfo: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  calendarContainer: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 2,
    borderBottomColor: '#e0e0e0',
  },
  timeHeaderCell: {
    width: 80,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  timeHeaderText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
  },
  courtHeaderCell: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  courtHeaderText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  courtSubText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
  },
  timeRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  timeCell: {
    width: 80,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  bookingCell: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    backgroundColor: '#fff',
    minHeight: 50,
  },
  bookedCell: {
    backgroundColor: '#ffebee',
  },
  notBookableCell: {
    backgroundColor: '#f5f5f5',
  },
  bookingCellText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4CAF50',
    textAlign: 'center',
  },
  bookedCellText: {
    color: '#F44336',
  },
  notBookableCellText: {
    color: '#999',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 8,
  },
  freeColor: {
    backgroundColor: '#4CAF50',
  },
  bookedColor: {
    backgroundColor: '#F44336',
  },
  blockedColor: {
    backgroundColor: '#999',
  },
  legendText: {
    fontSize: 14,
    color: '#666',
  },
  footerHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default BookingCalendar;
