import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

const TermsOfService = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Allgemeine Geschäftsbedingungen</Text>
        <Text style={styles.lastUpdated}>Zuletzt aktualisiert: 28. Januar 2026</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Geltungsbereich</Text>
          <Text style={styles.text}>
            Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für die Nutzung der JKB Grounds App und aller damit verbundenen Dienstleistungen. Mit der Registrierung und Nutzung der App akzeptieren Sie diese AGB vollständig.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Vertragspartner</Text>
          <Text style={styles.text}>
            JKB Grounds{'\n'}
            Musterstraße 123{'\n'}
            12345 Musterstadt{'\n'}
            Deutschland{'\n\n'}
            E-Mail: info@jkb-grounds.de{'\n'}
            Telefon: +49 (0) 123 456789{'\n'}
            Geschäftsführer: Max Mustermann{'\n'}
            Handelsregister: HRB 12345, Amtsgericht Musterstadt
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Leistungen</Text>
          <Text style={styles.text}>
            JKB Grounds bietet eine digitale Plattform für die Buchung und Verwaltung von Tennisplätzen. Die App ermöglicht:{'\n\n'}
            • Online-Buchung von Tennisplätzen{'\n'}
            • Verwaltung von Buchungen{'\n'}
            • Übersicht über verfügbare Plätze{'\n'}
            • Stornierung von Buchungen{'\n'}
            • Kommunikation mit dem Verein
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Registrierung und Nutzerkonto</Text>
          <Text style={styles.text}>
            Für die Nutzung der App ist eine Registrierung erforderlich. Sie verpflichten sich:{'\n\n'}
            • Wahrheitsgemäße Angaben zu machen{'\n'}
            • Ihre Zugangsdaten vertraulich zu behandeln{'\n'}
            • Unbefugte Nutzung Ihres Kontos zu verhindern{'\n'}
            • Änderungen Ihrer Daten umgehend mitzuteilen{'\n\n'}
            Jeder Nutzer darf nur ein Konto anlegen. Die Registrierung ist kostenlos.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Buchungen und Zahlungen</Text>
          <Text style={styles.subsectionTitle}>5.1 Buchungsvorgang</Text>
          <Text style={styles.text}>
            Buchungen kommen durch Ihre Bestätigung in der App zustande. Sie erhalten eine Buchungsbestätigung per E-Mail oder in der App.
          </Text>

          <Text style={styles.subsectionTitle}>5.2 Preise</Text>
          <Text style={styles.text}>
            Die Preise werden vom jeweiligen Tennisverein festgelegt und in der App angezeigt. Alle Preise verstehen sich inklusive der gesetzlichen Mehrwertsteuer.
          </Text>

          <Text style={styles.subsectionTitle}>5.3 Zahlung</Text>
          <Text style={styles.text}>
            Die Zahlung erfolgt je nach Verein über verschiedene Zahlungsmethoden (Bar, EC-Karte, Überweisung). Die Zahlungsmodalitäten werden bei der Buchung angezeigt.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Stornierung und Rücktritt</Text>
          <Text style={styles.subsectionTitle}>6.1 Stornierung durch den Nutzer</Text>
          <Text style={styles.text}>
            Buchungen können bis zu 24 Stunden vor dem gebuchten Termin kostenfrei storniert werden. Bei späteren Stornierungen kann eine Stornogebühr anfallen.
          </Text>

          <Text style={styles.subsectionTitle}>6.2 Stornierung durch den Anbieter</Text>
          <Text style={styles.text}>
            Wir behalten uns vor, Buchungen aufgrund von:{'\n'}
            • Witterungsbedingungen{'\n'}
            • Wartungsarbeiten{'\n'}
            • Technischen Problemen{'\n'}
            • Höherer Gewalt{'\n\n'}
            zu stornieren. In diesem Fall erhalten Sie eine vollständige Erstattung.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Nutzungsregeln</Text>
          <Text style={styles.text}>
            Bei der Nutzung der App und der Tennisanlagen ist Folgendes untersagt:{'\n\n'}
            • Missbrauch der Plattform{'\n'}
            • Weitergabe von Zugangsdaten{'\n'}
            • Buchung unter falschen Angaben{'\n'}
            • Störung des Betriebs{'\n'}
            • Verletzung von Rechten Dritter{'\n'}
            • Verstoß gegen die Hausordnung der Anlage
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Haftung</Text>
          <Text style={styles.subsectionTitle}>8.1 Haftungsbeschränkung</Text>
          <Text style={styles.text}>
            Wir haften nur für Schäden, die auf vorsätzlichem oder grob fahrlässigem Verhalten beruhen. Die Haftung für leichte Fahrlässigkeit ist ausgeschlossen, soweit nicht Leben, Körper, Gesundheit oder wesentliche Vertragspflichten betroffen sind.
          </Text>

          <Text style={styles.subsectionTitle}>8.2 Verfügbarkeit</Text>
          <Text style={styles.text}>
            Wir bemühen uns um eine hohe Verfügbarkeit der App, können jedoch keine 100%ige Verfügbarkeit garantieren. Wartungsarbeiten werden nach Möglichkeit angekündigt.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Datenschutz</Text>
          <Text style={styles.text}>
            Der Schutz Ihrer personenbezogenen Daten ist uns wichtig. Details entnehmen Sie bitte unserer Datenschutzerklärung, die Bestandteil dieser AGB ist.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Kündigung</Text>
          <Text style={styles.text}>
            Sie können Ihr Nutzerkonto jederzeit ohne Einhaltung einer Frist löschen. Wir können Ihr Konto bei Verstößen gegen diese AGB nach Abmahnung kündigen.{'\n\n'}
            Nach der Kündigung werden Ihre Daten entsprechend unserer Datenschutzerklärung behandelt.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Änderungen der AGB</Text>
          <Text style={styles.text}>
            Wir behalten uns vor, diese AGB bei berechtigtem Interesse zu ändern. Sie werden über Änderungen rechtzeitig per E-Mail oder in der App informiert. Widersprechen Sie den Änderungen nicht innerhalb von 4 Wochen, gelten sie als angenommen.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. Schlussbestimmungen</Text>
          <Text style={styles.subsectionTitle}>12.1 Anwendbares Recht</Text>
          <Text style={styles.text}>
            Es gilt deutsches Recht unter Ausschluss der Bestimmungen des UN-Kaufrechts.
          </Text>

          <Text style={styles.subsectionTitle}>12.2 Gerichtsstand</Text>
          <Text style={styles.text}>
            Gerichtsstand für alle Streitigkeiten ist Musterstadt, sofern Sie Kaufmann, juristische Person des öffentlichen Rechts oder öffentlich-rechtliches Sondervermögen sind.
          </Text>

          <Text style={styles.subsectionTitle}>12.3 Salvatorische Klausel</Text>
          <Text style={styles.text}>
            Sollten einzelne Bestimmungen dieser AGB unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen davon unberührt.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>13. Kontakt</Text>
          <Text style={styles.text}>
            Bei Fragen zu diesen AGB kontaktieren Sie uns unter:{'\n\n'}
            E-Mail: info@jkb-grounds.de{'\n'}
            Telefon: +49 (0) 123 456789{'\n\n'}
            Postanschrift:{'\n'}
            JKB Grounds{'\n'}
            Musterstraße 123{'\n'}
            12345 Musterstadt
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  lastUpdated: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 30,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DC143C',
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 15,
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    lineHeight: 22,
    color: '#374151',
    textAlign: 'justify',
  },
});

export default TermsOfService;
