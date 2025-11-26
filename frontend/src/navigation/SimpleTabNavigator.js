import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HomeScreen from '../screens/HomeScreen';
import BookingScreen from '../screens/BookingScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CRMScreen from '../screens/CRMScreen';
import ConfiguratorScreen from '../screens/ConfiguratorScreen';
import TestScrollScreen from '../screens/TestScrollScreen';

const SimpleTabNavigator = () => {
  const [activeTab, setActiveTab] = useState('Home');
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [renderKey, setRenderKey] = useState(0); // ← FORCE RE-RENDER

  // MARKTREIFE ROLLEN-PRÜFUNG
  const checkUserRole = async () => {
    try {
      console.log('🔍 Lade User-Rolle von API...');
      setIsLoading(true);
      
      // 1. ERWEITERTE User-ID Suche
      let userId = await AsyncStorage.getItem('userId');
      console.log('👤 User ID aus AsyncStorage:', userId);
      
      // FALLBACK: User-ID aus User-Objekt extrahieren
      if (!userId) {
        console.log('🔄 Versuche User-ID aus User-Objekt zu extrahieren...');
        const userString = await AsyncStorage.getItem('user');
        if (userString) {
          const user = JSON.parse(userString);
          userId = user.id;
          console.log('✅ User-ID aus User-Objekt:', userId);
          
          // User-ID für nächstes Mal speichern
          await AsyncStorage.setItem('userId', userId);
        }
      }
      
      if (!userId) {
        console.log('❌ Keine User-ID gefunden - weder direkt noch aus User-Objekt');
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }
  
      // 2. API-Aufruf mit gefundener User-ID (AWS Lambda)
      const response = await fetch(`https://crfdc7s6frt3rvczcg7l7xmddq0gjnxr.lambda-url.eu-central-1.on.aws/api/users/${userId}/role`);
      console.log('📡 API Response Status:', response.status);
      
      if (response.ok) {
        const userData = await response.json();
        console.log('📋 API-Response:', userData);
        
        const roleName = userData.rolle_name;
        const roleNameLower = (roleName || '').toLowerCase();
        const adminStatus = roleNameLower === 'admin';
        
        console.log('🔐 FINAL Admin Check:', {
          roleName,
          roleNameLower,
          adminStatus
        });
        
        // STATE UPDATES MIT FORCE RE-RENDER
        setIsAdmin(adminStatus);
        setUserRole(roleName);
        setRenderKey(prev => prev + 1);
        
        await AsyncStorage.setItem('userRole', roleName || 'user');
        
        console.log('🎯 STATE NACH UPDATE:', {
          isAdmin: adminStatus,
          userRole: roleName,
          renderKey: renderKey + 1
        });
        
        if (adminStatus) {
          console.log('✅ ADMIN MODUS AKTIVIERT - 5 TABS');
        } else {
          console.log('👤 USER MODUS - 3 TABS');
        }
        
      } else {
        console.log('❌ API-Fehler:', response.status);
        setIsAdmin(false);
        setUserRole('user');
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('❌ Fehler:', error);
      setIsAdmin(false);
      setUserRole('user');
      setIsLoading(false);
    }
  };

  // BEIM APP-START
  useEffect(() => {
    console.log('🚀 SimpleTabNavigator gestartet');
    checkUserRole();
  }, []);

  // STATE CHANGE WATCHER
  useEffect(() => {
    console.log('🔄 STATE CHANGE:', {
      isAdmin,
      userRole,
      renderKey,
      tabsCount: getTabs().length
    });
  }, [isAdmin, userRole, renderKey]);

  // TABS MIT DIREKTER ADMIN-PRÜFUNG
  const getTabs = () => {
    // MEHRFACHE ADMIN-PRÜFUNG
    const directAdminCheck = isAdmin === true;
    const roleAdminCheck = (userRole || '').toLowerCase() === 'admin';
    const finalAdminStatus = directAdminCheck || roleAdminCheck;
    
    console.log('🔄 getTabs - ADMIN CHECKS:', {
      isAdmin,
      userRole,
      directAdminCheck,
      roleAdminCheck,
      finalAdminStatus
    });
    
    if (finalAdminStatus) {
      console.log('✅ ADMIN TABS - 5 Stück');
      return [
        { key: 'Home', icon: '🏠', label: 'Home' },
        { key: 'Booking', icon: '🎾', label: 'Platzbuchung' },
        { key: 'Settings', icon: '⚙️', label: 'Einstellungen' },
        { key: 'Config', icon: '🔧', label: 'Konfigurator' },
        { key: 'CRM', icon: '👥', label: 'CRM' },
      ];
    }
    
    console.log('👤 USER TABS - 3 Stück');
    return [
      { key: 'Home', icon: '🏠', label: 'Home' },
      { key: 'Booking', icon: '🎾', label: 'Platzbuchung' },
      { key: 'CRM', icon: '👥', label: 'CRM' },
    ];
  };

  const renderScreen = () => {
    const screenProps = { 
      changeTab: setActiveTab,
      isAdmin: isAdmin,
      userRole: userRole
    };
    
    switch (activeTab) {
      case 'Home':
        return <HomeScreen {...screenProps} />;
      case 'Booking':
        return <BookingScreen {...screenProps} />;
      case 'Settings':
        return isAdmin ? <SettingsScreen {...screenProps} /> : <HomeScreen {...screenProps} />;
      case 'CRM':
        return <CRMScreen {...screenProps} />;
      case 'Config':
        return isAdmin ? <ConfiguratorScreen {...screenProps} /> : <HomeScreen {...screenProps} />;
      default:
        return <HomeScreen {...screenProps} />;
    }
  };

  // Loading-Screen
  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>🔍 Lade Benutzerrechte...</Text>
      </View>
    );
  }

  const tabs = getTabs();
  console.log('🖼️ RENDER:', {
    isAdmin,
    userRole,
    tabsCount: tabs.length,
    tabNames: tabs.map(t => t.label),
    renderKey
  });

  return (
    <View style={styles.container} key={renderKey}>
      {/* WEB-SPEZIFISCHE LÖSUNG: ScrollView für Web, View für Mobile */}
      {Platform.OS === 'web' ? (
        <ScrollView 
          style={styles.webContent} 
          contentContainerStyle={styles.webContentContainer}
          testID="tab-content"
          showsVerticalScrollIndicator={true}
        >
          {renderScreen()}
        </ScrollView>
      ) : (
        <View style={styles.content} testID="tab-content">
          {renderScreen()}
        </View>
      )}
      
      <View style={styles.tabBar}>
        <View style={styles.tabBarInner}>
          {tabs.map((tab) => (
            <TouchableOpacity 
              key={tab.key}
              style={[
                styles.tab, 
                activeTab === tab.key && styles.activeTab
              ]}
              onPress={() => {
                console.log('🔄 Tab gewechselt zu:', tab.key);
                setActiveTab(tab.key);
              }}
              activeOpacity={0.7}
            >
              {activeTab === tab.key && (
                <View style={styles.activeIndicator} />
              )}
              <View style={[
                styles.iconContainer,
                activeTab === tab.key && styles.activeIconContainer
              ]}>
                <Text style={[
                  styles.tabIcon,
                  activeTab === tab.key && styles.activeTabIcon
                ]}>
                  {tab.icon}
                </Text>
              </View>
              <Text style={[
                styles.tabText, 
                activeTab === tab.key && styles.activeTabText
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  webContent: {
    flex: 1,
    height: '100vh',
  },
  webContentContainer: {
    paddingBottom: 100, // Platz für Tab Bar
    minHeight: '100vh',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  tabBar: {
    position: 'fixed', // ← WEB: fixed statt absolute für bessere Performance
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingBottom: Platform.OS === 'web' ? 8 : 0,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.05)',
    minHeight: 70,
    zIndex: 9999, // ← ERHÖHT für Web
  },
  tabBarInner: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  activeTab: {},
  activeIndicator: {
    position: 'absolute',
    top: -8,
    width: 32,
    height: 3,
    backgroundColor: '#2E8B57',
    borderRadius: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  activeIconContainer: {
    backgroundColor: '#E8F5E8',
    transform: [{ scale: 1.1 }],
  },
  tabIcon: {
    fontSize: 24,
    opacity: 0.6,
  },
  activeTabIcon: {
    fontSize: 26,
    opacity: 1,
  },
  tabText: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
    marginTop: 2,
  },
  activeTabText: {
    color: '#2E8B57',
    fontWeight: '600',
    fontSize: 12,
  },
});

export default SimpleTabNavigator;