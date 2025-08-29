import React, { createContext, useContext, useState } from 'react';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);

  const setUser = async (userData) => {
    console.log('Setze User:', userData);
    setCurrentUser(userData);
    
    // Persistierung für beide Plattformen
    if (typeof window !== 'undefined' && window.localStorage) {
      // Web: localStorage
      try {
        localStorage.setItem('currentUser', JSON.stringify(userData));
      } catch (error) {
        console.log('LocalStorage Fehler:', error);
      }
    } else {
      // React Native: AsyncStorage
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem('currentUser', JSON.stringify(userData));
      } catch (error) {
        console.log('AsyncStorage nicht verfügbar:', error);
      }
    }
  };

  const getUser = async () => {
    // Zuerst aus State
    if (currentUser) {
      console.log('User aus State:', currentUser);
      return currentUser;
    }

    // Dann aus Storage
    try {
      let userData = null;
      
      if (typeof window !== 'undefined' && window.localStorage) {
        // Web: localStorage
        userData = localStorage.getItem('currentUser');
      } else {
        // React Native: AsyncStorage
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          userData = await AsyncStorage.getItem('currentUser');
        } catch (error) {
          console.log('AsyncStorage nicht verfügbar');
          return null;
        }
      }
      
      if (userData) {
        const user = JSON.parse(userData);
        setCurrentUser(user);
        console.log('User aus Storage geladen:', user);
        return user;
      }
    } catch (error) {
      console.error('Fehler beim Laden der Benutzer-Daten:', error);
    }

    console.log('Kein User gefunden');
    return null;
  };

  const clearUser = async () => {
    console.log('User wird gelöscht');
    setCurrentUser(null);
    
    // Aus beiden Storages löschen
    if (typeof window !== 'undefined' && window.localStorage) {
      // Web: localStorage
      try {
        localStorage.removeItem('currentUser');
      } catch (error) {
        console.log('localStorage clear Fehler:', error);
      }
    } else {
      // React Native: AsyncStorage
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.removeItem('currentUser');
      } catch (error) {
        console.log('AsyncStorage clear Fehler:', error);
      }
    }
  };

  return (
    <UserContext.Provider value={{
      currentUser,
      setUser,
      getUser,
      clearUser
    }}>
      {children}
    </UserContext.Provider>
  );
};