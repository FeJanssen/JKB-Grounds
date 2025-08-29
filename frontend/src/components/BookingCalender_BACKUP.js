import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import BookingModal from './BookingModal';

const BookingCalendar = ({ courts = [], canBookPublic = false, vereinId = null }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('day');
  const [timeSlots, setTimeSlots] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [courtStartIndex, setCourtStartIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const COURTS_PER_VIEW = 3;
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
        console.error('Keine Verein-ID verfügbar');
        setBookings([]);
        return;
      }
      
      const response = await fetch(`https://jkb-grounds-production.up.railway.app/api/bookings/date/${dateString}?verein_id=${vereinId}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Geladene Buchungen:', data.bookings);
        
        if (data.bookings && data.bookings.length > 0) {
          console.log('Erste Buchung Details:', {
            platz_id: data.bookings[0].platz_id,
            uhrzeit_von: data.bookings[0].uhrzeit_von,
            uhrzeit_bis: data.bookings[0].uhrzeit_bis
          });
        }
        
        setBookings(data.bookings || []);
      } else {
        console.error('Fehler beim Laden der Buchungen');
        setBookings([]);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Buchungen:', error);
      setBookings([]);
    }
  };

  const isTimeSlotBooked = (courtId, timeSlot) => {
    return bookings.some(booking => {
      const bookingStart = booking.uhrzeit_von.substring(0, 5);
      const bookingEnd = booking.uhrzeit_bis.substring(0, 5);
      
      return booking.platz_id === courtId && 
             bookingStart <= timeSlot && 
             bookingEnd > timeSlot;
    });
  };

  const getBookingInfo = (courtId, timeSlot) => {
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
      console.log('Sende Buchungsdaten:', bookingData);
      
      const response = await fetch('https://jkb-grounds-production.up.railway.app/api/bookings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': '626093ad-1de3-454f-af72-fd38030613f7'
        },
        body: JSON.stringify(bookingData)
      });
      
      const data = await response.json();
      console.log('Backend Response:', data);
      
      if (response.ok && data.status === 'success') {
        Alert.alert(
          'Buchung erfolgreich!',
          `Platz wurde für ${bookingData.date} um ${bookingData.time} gebucht.`,
          [{ 
            text: 'OK', 
            onPress: () => {
              loadBookingsForDate(selectedDate);
            }
          }]
        );
      } else {
        throw new Error(data.detail || 'Buchung fehlgeschlagen');
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
    <View style={styles.container}>
      {/* Permission Header */}
      <View style={styles.permissionHeader}>
        <Text style={styles.permissionTitle}>Ihre Buchungsberechtigungen:</Text>
        <View style={styles.permissionRow}>
          <Text style={styles.permissionItem}>
            Private Buchung: <Text style={styles.permissionEnabled}>Verfügbar</Text>
          </Text>
          <Text style={styles.permissionItem}>
            Öffentliche Buchung: {canBookPublic ? (
              <Text style={styles.permissionEnabled}>Verfügbar</Text>
            ) : (
              <Text style={styles.permissionDisabled}>Nicht verfügbar</Text>
            )}
          </Text>
        </View>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Buchungskalender</Text>
        <View style={styles.dateNavigation}>
          <TouchableOpacity style={styles.navButton} onPress={goToPreviousDay}>
            <Text style={styles.navButtonText}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dateContainer} onPress={goToToday}>
            <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButton} onPress={goToNextDay}>
            <Text style={styles.navButtonText}>→</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Court Navigation */}
        {courts.length > COURTS_PER_VIEW && (
          <View style={styles.courtNavigation}>
            <TouchableOpacity 
              style={[styles.courtNavButton, !canShowPreviousCourts && styles.courtNavButtonDisabled]}
              onPress={goToPreviousCourts}
              disabled={!canShowPreviousCourts}
            >
              <Text style={styles.courtNavButtonText}>← Vorherige</Text>
            </TouchableOpacity>
            
            <Text style={styles.courtNavInfo}>
              Plätze {courtStartIndex + 1}-{Math.min(courtStartIndex + COURTS_PER_VIEW, courts.length)} von {courts.length}
            </Text>
            
            <TouchableOpacity 
              style={[styles.courtNavButton, !canShowNextCourts && styles.courtNavButtonDisabled]}
              onPress={goToNextCourts}
              disabled={!canShowNextCourts}
            >
              <Text style={styles.courtNavButtonText}>Nächste →</Text>
            </TouchableOpacity>
          </View>
        )}

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
                    <Text style={[
                      styles.bookingCellText,
                      isBooked && styles.bookedCellText,
                      !isBookable && styles.notBookableCellText
                    ]}>
                      {isBooked ? 'Gebucht' : (isBookable ? 'Frei' : 'Gesperrt')}
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
      </ScrollView>

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
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginHorizontal: 8,
  },
  navButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  dateContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  dateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    minWidth: 200,
  },
  content: {
    flex: 1,
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
