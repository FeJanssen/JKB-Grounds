import React from 'react';
import AppNavigator from './src/AppNavigator';
import { UserProvider } from './src/context/UserContext';
import { PermissionProvider } from './src/context/PermissionContext';

// WEB: CSS-Import für Scrolling-Fixes
if (typeof window !== 'undefined') {
  require('./web-scroll-fix.css');
}

export default function App() {
  return (
    <PermissionProvider>
      <UserProvider>
        <AppNavigator />
      </UserProvider>
    </PermissionProvider>
  );
}