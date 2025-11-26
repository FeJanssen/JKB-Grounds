import React, { createContext, useContext, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/baseUrl';

const PermissionContext = createContext();

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions muss innerhalb von PermissionProvider verwendet werden');
  }
  return context;
};

export const PermissionProvider = ({ children }) => {
  const [permissions, setPermissions] = useState({
    darf_buchen: false,
    darf_oeffentlich_buchen: false,
    loaded: false
  });
  
  const [userInfo, setUserInfo] = useState({
    userId: null,
    vereinId: null,
    rolleId: null,
    rolleName: null
  });

  const loadUserPermissions = async () => {
    try {
      console.log('🔐 STEP 1: Starte Permission Loading...');
      
      // SCHRITT 1: User-ID aus AsyncStorage
      // ✅ KONSISTENTE USER-ID SUCHE  
      let userId = await AsyncStorage.getItem('userId') || // ← Hauptkey
                   await AsyncStorage.getItem('user_id');  // ← Fallback
      
      if (!userId) {
        throw new Error('Keine User-ID gefunden');
      }
      
      console.log('👤 STEP 2: User-ID gefunden:', userId);

      // SCHRITT 2: User-Daten laden
      const userResponse = await fetch(`${API_BASE_URL}/api/auth/auth/user/${userId}`);
      
      if (!userResponse.ok) {
        throw new Error(`User-API Fehler: ${userResponse.status}`);
      }
      
      const userData = await userResponse.json();
      console.log('👤 STEP 3: User-Daten erhalten:', userData);
      
      if (!userData.rolle_id || !userData.verein_id) {
        throw new Error('User-Daten unvollständig (rolle_id oder verein_id fehlt)');
      }

      // SCHRITT 3: Rechte für diese Kombination laden
      console.log(`🔐 STEP 4: Lade Rechte für Verein: ${userData.verein_id}, Rolle: ${userData.rolle_id}`);
      
      const rechteResponse = await fetch(
        `${API_BASE_URL}/api/permissions/rechte/${userData.verein_id}/${userData.rolle_id}`
      );
      
      if (!rechteResponse.ok) {
        console.log('⚠️ STEP 4 FEHLER: Rechte-API nicht verfügbar, verwende Fallback');
        
        // FALLBACK: Grundberechtigungen
        setPermissions({
          darf_buchen: true,
          darf_oeffentlich_buchen: false,
          loaded: true
        });
        
        setUserInfo({
          userId: userId,
          vereinId: userData.verein_id,
          rolleId: userData.rolle_id,
          rolleName: 'Unbekannt'
        });
        
        return;
      }
      
      const rechteData = await rechteResponse.json();
      console.log('🔐 STEP 5: Rechte-Daten erhalten:', rechteData);

      // SCHRITT 4: State aktualisieren
      setUserInfo({
        userId: userId,
        vereinId: userData.verein_id,
        rolleId: userData.rolle_id,
        rolleName: rechteData.rolle_name || 'Unbekannt'
      });

      setPermissions({
        darf_buchen: rechteData.darf_buchen === true,
        darf_oeffentlich_buchen: rechteData.darf_oeffentlich_buchen === true,
        loaded: true
      });

      console.log('✅ STEP 6: Permissions erfolgreich gesetzt:', {
        darf_buchen: rechteData.darf_buchen,
        darf_oeffentlich_buchen: rechteData.darf_oeffentlich_buchen,
        rolle: rechteData.rolle_name
      });

    } catch (error) {
      console.error('❌ PERMISSION FEHLER:', error);
      
      // Fallback bei Fehlern
      setPermissions({
        darf_buchen: true,           // Jeder darf basic buchen
        darf_oeffentlich_buchen: false, // Aber nicht öffentlich
        loaded: true
      });
      
      setUserInfo({
        userId: null,
        vereinId: null,
        rolleId: null,
        rolleName: 'Fehler'
      });
    }
  };

  // Helper Functions
  const canBook = () => {
    const result = permissions.darf_buchen && permissions.loaded;
    console.log('🔍 canBook():', { 
      darf_buchen: permissions.darf_buchen, 
      loaded: permissions.loaded, 
      result: result 
    });
    return result;
  };

  const canBookPublic = () => {
    const result = permissions.darf_oeffentlich_buchen && permissions.loaded;
    console.log('🔍 canBookPublic():', { 
      darf_oeffentlich_buchen: permissions.darf_oeffentlich_buchen, 
      loaded: permissions.loaded, 
      result: result 
    });
    return result;
  };

  const isPermissionsLoaded = () => permissions.loaded;

  const value = {
    permissions,
    userInfo,
    canBook,
    canBookPublic,
    isPermissionsLoaded,
    loadUserPermissions
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};