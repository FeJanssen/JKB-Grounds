import React from 'react';
import { View, Platform } from 'react-native';

const ScrollableContainer = ({ children, style }) => {
  if (Platform.OS === 'web') {
    return (
      <div
        style={{
          height: 'calc(100vh - 120px)', // ✅ Viewport minus Bottom Bar Space
          maxHeight: 'calc(100vh - 120px)',
          overflow: 'auto',
          backgroundColor: '#f5f5f5',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: '30px',
          ...style,
        }}
      >
        {children}
      </div>
    );
  }
  
  // Für mobile Apps verwenden wir View
  return (
    <View style={[{ flex: 1, paddingBottom: 120 }, style]}>
      {children}
    </View>
  );
};

export default ScrollableContainer;
