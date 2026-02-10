import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

const Imprint = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Impressum</Text>
        <Text style={styles.subtitle}>Angaben gemäß § 5 TMG</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diensteanbieter</Text>
          <Text style={styles.text}>
            JKB Grounds GmbH{'\n'}
            Musterstraße 123{'\n'}
            12345 Musterstadt{'\n'}
            Deutschland
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kontakt</Text>
          <Text style={styles.text}>
            Telefon: +49 (0) 123 456789{'\n'}
            Telefax: +49 (0) 123 456790{'\n'}
            E-Mail: info@jkb-grounds.de{'\n'}
            Website: https://jkb-grounds.de
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Handelsregister</Text>
          <Text style={styles.text}>
            Registergericht: Amtsgericht Musterstadt{'\n'}
            Registernummer: HRB 12345
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Umsatzsteuer</Text>
          <Text style={styles.text}>
            Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:{'\n'}
            DE123456789
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Geschäftsführung</Text>
          <Text style={styles.text}>
            Max Mustermann (Geschäftsführer){'\n'}
            Anna Beispiel (Geschäftsführerin)
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aufsichtsbehörde</Text>
          <Text style={styles.text}>
            Gewerbeaufsichtsamt Musterstadt{'\n'}
            Behördenstraße 1{'\n'}
            12345 Musterstadt{'\n'}
            Deutschland
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verantwortlich für den Inhalt</Text>
          <Text style={styles.subsectionTitle}>nach § 55 Abs. 2 RStV:</Text>
          <Text style={styles.text}>
            Max Mustermann{'\n'}
            JKB Grounds GmbH{'\n'}
            Musterstraße 123{'\n'}
            12345 Musterstadt{'\n'}
            Deutschland
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Haftungshinweis</Text>
          <Text style={styles.text}>
            Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die Inhalte externer Links. Für den Inhalt der verlinkten Seiten sind ausschließlich deren Betreiber verantwortlich.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Urheberrecht</Text>
          <Text style={styles.text}>
            Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Streitbeilegung</Text>
          <Text style={styles.text}>
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: https://ec.europa.eu/consumers/odr/{'\n\n'}
            Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Technische Umsetzung</Text>
          <Text style={styles.text}>
            App-Entwicklung: JKB Development Team{'\n'}
            Hosting: AWS (Amazon Web Services){'\n'}
            Datenbank: Supabase{'\n'}
            Framework: React Native / Expo
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lizenzhinweise</Text>
          <Text style={styles.text}>
            Diese App verwendet Open-Source-Software. Die verwendeten Lizenzen und Bibliotheken können in der App unter "Über diese App" → "Lizenzen" eingesehen werden.
          </Text>
        </View>

        <Text style={styles.footer}>
          Stand: 28. Januar 2026
        </Text>
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
  subtitle: {
    fontSize: 16,
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
    marginTop: 5,
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    lineHeight: 22,
    color: '#374151',
  },
  footer: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
});

export default Imprint;
