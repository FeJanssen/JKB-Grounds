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
      
      // SCHRITT 1: User-Daten direkt aus AsyncStorage laden (wurden beim Login gespeichert)
      const currentUserData = await AsyncStorage.getItem('currentUser');
      
      if (!currentUserData) {
        throw new Error('Keine User-Daten im Storage gefunden - bitte neu einloggen');
      }
      
      const userData = JSON.parse(currentUserData);
      console.log('👤 STEP 2: User-Daten aus AsyncStorage:', userData);
      
      // Validierung der benötigten Felder
      if (!userData.id || !userData.rolle_id || !userData.verein_id) {
        throw new Error('User-Daten unvollständig (id, rolle_id oder verein_id fehlt)');
      }

      // SCHRITT 2: Rechte für diese Kombination laden
      console.log(`🔐 STEP 3: Lade Rechte für Verein: ${userData.verein_id}, Rolle: ${userData.rolle_id}`);
      
      const rechteResponse = await fetch(
        `${API_BASE_URL}/api/permissions/rechte/${userData.verein_id}/${userData.rolle_id}`
      );
      
      if (!rechteResponse.ok) {
        console.log('⚠️ STEP 3 FEHLER: Rechte-API nicht verfügbar, verwende Fallback basierend auf Rolle');
        
        // INTELLIGENTER FALLBACK basierend auf Role Name falls verfügbar
        const isAdmin = userData.rolle_name && userData.rolle_name.toLowerCase().includes('admin');
        
        setPermissions({
          darf_buchen: true,
          darf_oeffentlich_buchen: isAdmin, // Admins dürfen öffentlich buchen
          loaded: true
        });
        
        setUserInfo({
          userId: userData.id,
          vereinId: userData.verein_id,
          rolleId: userData.rolle_id,
          rolleName: userData.rolle_name || 'Unbekannt'
        });
        
        console.log('✅ FALLBACK: Permissions gesetzt basierend auf lokalen Daten:', {
          darf_buchen: true,
          darf_oeffentlich_buchen: isAdmin,
          rolle: userData.rolle_name
        });
        
        return;
      }
      
      const rechteData = await rechteResponse.json();
      console.log('🔐 STEP 4: Rechte-Daten erhalten:', rechteData);

      // SCHRITT 3: State aktualisieren
      setUserInfo({
        userId: userData.id,
        vereinId: userData.verein_id,
        rolleId: userData.rolle_id,
        rolleName: rechteData.rolle_name || userData.rolle_name || 'Unbekannt'
      });

      setPermissions({
        darf_buchen: rechteData.darf_buchen === true,
        darf_oeffentlich_buchen: rechteData.darf_oeffentlich_buchen === true,
        loaded: true
      });

      console.log('✅ STEP 5: Permissions erfolgreich gesetzt:', {
        darf_buchen: rechteData.darf_buchen,
        darf_oeffentlich_buchen: rechteData.darf_oeffentlich_buchen,
        rolle: rechteData.rolle_name
      });

    } catch (error) {
      console.error('❌ PERMISSION FEHLER:', error);
      
      // ULTRA-FALLBACK bei allen Fehlern
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

      console.log('🆘 ULTRA-FALLBACK: Basis-Permissions gesetzt');
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