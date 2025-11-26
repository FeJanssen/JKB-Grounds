import React from 'react';
import AppNavigator from './src/AppNavigator';
import { UserProvider } from './src/context/UserContext';
import { PermissionProvider } from './src/context/PermissionContext';

// CSS-Import entfernt - wird über React Native Styles gelöst

export default function App() {
  return (
    <PermissionProvider>
      <UserProvider>
        <AppNavigator />
      </UserProvider>
    </PermissionProvider>
  );
}