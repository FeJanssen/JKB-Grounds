/**
 * 🎯 SERIES BOOKING GROUPING UTILITY
 * 
 * Gruppiert Einzelbuchungen zu Serienbuchungen basierend auf:
 * - Gleicher Platz
 * - Gleiche Zeit
 * - Gleiche Wochentage
 * - Gleichmäßiger wöchentlicher Abstand
 */

/**
 * Gruppiert Buchungen zu Serien
 * @param {Array} bookings - Liste aller Buchungen
 * @returns {Object} - { series: [], individual: [] }
 */
export const groupBookingsIntoSeries = (bookings) => {
  console.log('🔄 Gruppiere Buchungen:', bookings.length);
  
  const series = [];
  const individual = [];
  const processed = new Set(); // Verfolgt bereits verarbeitete Buchungs-IDs
  
  // Sortiere Buchungen nach Datum für bessere Gruppierung
  const sortedBookings = [...bookings].sort((a, b) => new Date(a.datum) - new Date(b.datum));
  
  for (const booking of sortedBookings) {
    if (processed.has(booking.id)) continue;
    
    // Finde potenzielle Serie-Partner
    const seriesMembers = findSeriesMembers(booking, sortedBookings, processed);
    
    if (seriesMembers.length >= 2) {
      // Es ist eine Serie (mindestens 2 Buchungen)
      const seriesInfo = createSeriesInfo(seriesMembers);
      series.push(seriesInfo);
      
      // Markiere alle Mitglieder als verarbeitet
      seriesMembers.forEach(member => processed.add(member.id));
      
      console.log('📊 Serie erkannt:', seriesInfo.name, `(${seriesMembers.length} Buchungen)`);
    } else {
      // Einzelbuchung
      individual.push(booking);
      processed.add(booking.id);
    }
  }
  
  console.log('✅ Gruppierung abgeschlossen:', { series: series.length, individual: individual.length });
  
  return { series, individual };
};

/**
 * Findet alle Buchungen die zu einer Serie gehören könnten
 */
const findSeriesMembers = (baseBooking, allBookings, processed) => {
  const members = [baseBooking];
  const baseDate = new Date(baseBooking.datum);
  const baseDayOfWeek = baseDate.getDay();
  
  // Suche nach Buchungen die zur Serie passen könnten
  for (const booking of allBookings) {
    if (booking.id === baseBooking.id || processed.has(booking.id)) continue;
    
    // Prüfe Serie-Kriterien
    if (isSameSeries(baseBooking, booking, baseDayOfWeek)) {
      members.push(booking);
    }
  }
  
  // Sortiere Mitglieder nach Datum
  members.sort((a, b) => new Date(a.datum) - new Date(b.datum));
  
  // Prüfe ob es tatsächlich eine wöchentliche Serie ist
  if (members.length >= 2 && isWeeklySeries(members)) {
    return members;
  }
  
  return [baseBooking]; // Keine Serie gefunden
};

/**
 * Prüft ob zwei Buchungen zur gleichen Serie gehören könnten
 */
const isSameSeries = (booking1, booking2, baseDayOfWeek) => {
  // Gleicher Platz
  if (booking1.platz_id !== booking2.platz_id) return false;
  
  // Gleiche Zeit
  if (booking1.uhrzeit_von !== booking2.uhrzeit_von) return false;
  if (booking1.uhrzeit_bis !== booking2.uhrzeit_bis) return false;
  
  // Gleicher Wochentag
  const date2 = new Date(booking2.datum);
  if (date2.getDay() !== baseDayOfWeek) return false;
  
  // Gleiche Notizen (falls vorhanden)
  const notes1 = booking1.notizen?.trim() || '';
  const notes2 = booking2.notizen?.trim() || '';
  if (notes1 && notes2 && notes1 !== notes2) return false;
  
  return true;
};

/**
 * Prüft ob die Buchungen in wöchentlichen Abständen sind
 */
const isWeeklySeries = (members) => {
  if (members.length < 2) return false;
  
  const dates = members.map(m => new Date(m.datum));
  
  // Prüfe Abstände zwischen aufeinanderfolgenden Buchungen
  for (let i = 1; i < dates.length; i++) {
    const daysDiff = (dates[i] - dates[i-1]) / (1000 * 60 * 60 * 24);
    
    // Wöchentlicher Abstand sollte 7 Tage sein (mit kleiner Toleranz)
    if (daysDiff < 6 || daysDiff > 8) {
      return false;
    }
  }
  
  return true;
};

/**
 * Erstellt Serien-Info Objekt
 */
const createSeriesInfo = (members) => {
  const firstBooking = members[0];
  const lastBooking = members[members.length - 1];
  const platzName = firstBooking.platz?.name || `Platz ${firstBooking.platz_id}`;
  const weekday = getWeekdayName(firstBooking.datum);
  const notes = firstBooking.notizen?.trim() || '';
  
  // Serie Name generieren
  let seriesName = `${platzName} - ${weekday}`;
  if (notes) {
    seriesName = `${notes} (${platzName})`;
  }
  
  return {
    id: `series_${firstBooking.platz_id}_${firstBooking.uhrzeit_von}_${Date.now()}`,
    name: seriesName,
    type: 'series',
    platz_id: firstBooking.platz_id,
    platz: firstBooking.platz,
    time: `${firstBooking.uhrzeit_von.substring(0, 5)} - ${firstBooking.uhrzeit_bis.substring(0, 5)}`,
    weekday: weekday,
    startDate: firstBooking.datum,
    endDate: lastBooking.datum,
    weeks: members.length,
    notes: notes,
    members: members,
    // Für UI
    isCollapsed: true,
    allSelected: false
  };
};

/**
 * Wochentag auf Deutsch
 */
const getWeekdayName = (dateString) => {
  const date = new Date(dateString);
  const weekdays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  return weekdays[date.getDay()];
};

/**
 * Format Datum für Anzeige
 */
export const formatDateRange = (startDate, endDate) => {
  const start = new Date(startDate).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  const end = new Date(endDate).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `${start} - ${end}`;
};
