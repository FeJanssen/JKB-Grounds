import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Platform } from 'react-native';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import PublicClubListScreen from './screens/PublicClubListScreen';
import PublicInfoScreen from './screens/PublicInfoScreen';
import SimpleTabNavigator from './navigation/SimpleTabNavigator'; // NEU

const Stack = createStackNavigator();

// Linking configuration für Web-URLs
const linking = {
  prefixes: ['https://main.d1wyodl7lpyx0o.amplifyapp.com/', 'http://localhost:19006/'],
  config: {
    screens: {
      // Öffentliche Vereinsseiten: /vereinsname
      PublicInfo: {
        path: '/:clubSlug',
        parse: {
          clubSlug: (clubSlug) => clubSlug,
        },
      },
      // Alternative: /club/vereinsname  
      PublicClubList: 'clubs',
      Login: 'login',
      Register: 'register',
      MainTabs: {
        screens: {
          // Deine bestehenden Tab-Screens hier
        },
      },
    },
  },
};

const AppNavigator = () => {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2E8B57',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{
            title: 'Anmelden',
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen}
          options={{
            title: 'Registrieren',
            headerShown: true,
          }}
        />
        <Stack.Screen 
          name="PublicClubList" 
          component={PublicClubListScreen}
          options={{
            title: 'Vereinsinfos',
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="PublicInfo" 
          component={PublicInfoScreen}
          options={{
            title: 'Vereinsinformationen',
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="MainTabs" 
          component={SimpleTabNavigator}
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;