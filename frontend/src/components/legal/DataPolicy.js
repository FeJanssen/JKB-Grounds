import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

const DataPolicy = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Datenschutzerklärung</Text>
        <Text style={styles.lastUpdated}>Zuletzt aktualisiert: 28. Januar 2026</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Verantwortliche Stelle</Text>
          <Text style={styles.text}>
            JKB Grounds{'\n'}
            Musterstraße 123{'\n'}
            12345 Musterstadt{'\n'}
            Deutschland{'\n\n'}
            E-Mail: datenschutz@jkb-grounds.de{'\n'}
            Telefon: +49 (0) 123 456789
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Erhebung und Verarbeitung personenbezogener Daten</Text>
          <Text style={styles.text}>
            Wir erheben und verarbeiten personenbezogene Daten nur, soweit dies zur Bereitstellung unserer Dienste erforderlich ist oder Sie uns Ihre Einwilligung erteilt haben.
          </Text>

          <Text style={styles.subsectionTitle}>2.1 Registrierung und Nutzung</Text>
          <Text style={styles.text}>
            Bei der Registrierung erheben wir:{'\n'}
            • Name (Vor- und Nachname){'\n'}
            • E-Mail-Adresse{'\n'}
            • Passwort (verschlüsselt gespeichert){'\n'}
            • Geschlecht (optional){'\n'}
            • Vereinszugehörigkeit
          </Text>

          <Text style={styles.subsectionTitle}>2.2 Buchungsdaten</Text>
          <Text style={styles.text}>
            Zur Verwaltung Ihrer Buchungen speichern wir:{'\n'}
            • Buchungszeitraum und -datum{'\n'}
            • Gebuchte Tennisplätze{'\n'}
            • Buchungshistorie{'\n'}
            • Stornierungen
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Rechtsgrundlagen der Verarbeitung</Text>
          <Text style={styles.text}>
            Die Verarbeitung Ihrer personenbezogenen Daten erfolgt auf Grundlage von:{'\n\n'}
            • Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung){'\n'}
            • Art. 6 Abs. 1 lit. f DSGVO (berechtigte Interessen){'\n'}
            • Art. 6 Abs. 1 lit. a DSGVO (Einwilligung)
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Datenweitergabe</Text>
          <Text style={styles.text}>
            Ihre personenbezogenen Daten werden nur in folgenden Fällen an Dritte weitergegeben:{'\n\n'}
            • Soweit dies zur Vertragserfüllung erforderlich ist{'\n'}
            • Bei gesetzlicher Verpflichtung{'\n'}
            • Mit Ihrer ausdrücklichen Einwilligung{'\n\n'}
            Wir verkaufen Ihre Daten niemals an Dritte.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Speicherdauer</Text>
          <Text style={styles.text}>
            Wir speichern Ihre Daten nur solange, wie es für die Zweckerfüllung erforderlich ist oder gesetzliche Aufbewahrungsfristen bestehen.{'\n\n'}
            • Kontodaten: Bis zur Löschung Ihres Kontos{'\n'}
            • Buchungsdaten: 10 Jahre (steuerrechtliche Aufbewahrungspflicht){'\n'}
            • Kommunikationsdaten: 3 Jahre
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Ihre Rechte</Text>
          <Text style={styles.text}>
            Sie haben folgende Rechte bezüglich Ihrer personenbezogenen Daten:
          </Text>
          
          <Text style={styles.subsectionTitle}>6.1 Auskunftsrecht (Art. 15 DSGVO)</Text>
          <Text style={styles.text}>
            Sie können jederzeit Auskunft über die von uns gespeicherten personenbezogenen Daten verlangen.
          </Text>

          <Text style={styles.subsectionTitle}>6.2 Berichtigungsrecht (Art. 16 DSGVO)</Text>
          <Text style={styles.text}>
            Sie können die Berichtigung unrichtiger oder Vervollständigung unvollständiger Daten verlangen.
          </Text>

          <Text style={styles.subsectionTitle}>6.3 Löschungsrecht (Art. 17 DSGVO)</Text>
          <Text style={styles.text}>
            Sie können die Löschung Ihrer personenbezogenen Daten verlangen, sofern keine gesetzlichen Aufbewahrungspflichten entgegenstehen.
          </Text>

          <Text style={styles.subsectionTitle}>6.4 Datenübertragbarkeit (Art. 20 DSGVO)</Text>
          <Text style={styles.text}>
            Sie haben das Recht, Ihre Daten in einem strukturierten, gängigen und maschinenlesbaren Format zu erhalten.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Datensicherheit</Text>
          <Text style={styles.text}>
            Wir setzen technische und organisatorische Maßnahmen ein, um Ihre Daten gegen Verlust, Manipulation und unberechtigten Zugriff zu schützen:{'\n\n'}
            • SSL/TLS-Verschlüsselung{'\n'}
            • Passwort-Hashing mit bcrypt{'\n'}
            • Regelmäßige Sicherheitsupdates{'\n'}
            • Zugriffskontrolle und Protokollierung
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Cookies und Tracking</Text>
          <Text style={styles.text}>
            Unsere App verwendet keine Cookies oder Tracking-Technologien. Alle Daten werden lokal auf Ihrem Gerät oder auf unseren sicheren Servern gespeichert.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Beschwerderecht</Text>
          <Text style={styles.text}>
            Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde über die Verarbeitung Ihrer personenbezogenen Daten durch uns zu beschweren.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Kontakt</Text>
          <Text style={styles.text}>
            Bei Fragen zum Datenschutz kontaktieren Sie uns unter:{'\n\n'}
            E-Mail: datenschutz@jkb-grounds.de{'\n'}
            Telefon: +49 (0) 123 456789{'\n\n'}
            Postanschrift:{'\n'}
            JKB Grounds - Datenschutz{'\n'}
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

export default DataPolicy;
