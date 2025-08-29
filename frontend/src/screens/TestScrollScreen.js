import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

const TestScrollScreen = () => {
  // Erstelle viele Elemente zum Testen des Scrollings
  const items = Array.from({ length: 50 }, (_, i) => `Item ${i + 1}`);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Scroll Test</Text>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={true}>
        {items.map((item, index) => (
          <View key={index} style={styles.item}>
            <Text style={styles.itemText}>{item}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 20,
    backgroundColor: '#000',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
    padding: 10,
  },
  item: {
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 5,
    borderRadius: 8,
  },
  itemText: {
    fontSize: 16,
  },
});

export default TestScrollScreen;
