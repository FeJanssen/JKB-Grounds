import React from 'react';
import { Modal, View, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DataPolicy from './DataPolicy';
import TermsOfService from './TermsOfService';
import Imprint from './Imprint';

const LegalModal = ({ visible, onClose, document }) => {
  const renderDocument = () => {
    switch (document) {
      case 'dataPolicy':
        return <DataPolicy />;
      case 'terms':
        return <TermsOfService />;
      case 'imprint':
        return <Imprint />;
      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={onClose}
          >
            <Ionicons name="close" size={28} color="#1e293b" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.content}>
          {renderDocument()}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  closeButton: {
    padding: 5,
  },
  content: {
    flex: 1,
  },
});

export default LegalModal;
