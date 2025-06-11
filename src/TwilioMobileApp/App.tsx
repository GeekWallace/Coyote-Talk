import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import messaging from '@react-native-firebase/messaging';
import { AuthProvider } from './src/context/AuthContext';
import { TwilioProvider } from './src/context/TwilioContext';
import { MaterialIcons } from '@expo/vector-icons';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import DialPadScreen from './src/screens/DialPadScreen';
import MessagingScreen from './src/screens/MessagingScreen';
import ContactsScreen from './src/screens/ContactsScreen';
import VoicemailScreen from './src/screens/VoicemailScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import IncomingCallScreen from './src/screens/IncomingCallScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main tab navigator for authenticated users
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
    screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          // Define icon names for each route
          if (route.name === 'Dial') {
            iconName = 'dialpad';
          } else if (route.name === 'Messages') {
            iconName = 'message';
          } else if (route.name === 'Contacts') {
            iconName = 'contacts';
          } else if (route.name === 'Voicemail') {
            iconName = 'voicemail';
          } else if (route.name === 'Settings') {
            iconName = 'settings';
          }
          
          // Return the icon component
          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF', // Active tab color (blue)
        tabBarInactiveTintColor: 'gray',  // Inactive tab color
      })}
          >
      <Tab.Screen name="Dial" component={DialPadScreen} />
      <Tab.Screen name="Messages" component={MessagingScreen} />
      <Tab.Screen name="Contacts" component={ContactsScreen} />
      <Tab.Screen name="Voicemail" component={VoicemailScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

// Root navigator with authentication flow
const App = () => {
  // Request permission for push notifications
  React.useEffect(() => {
    const requestUserPermission = async () => {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Authorization status:', authStatus);
      }
    };

    requestUserPermission();
  }, []);
  return (
    <AuthProvider>
      <TwilioProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen name="IncomingCall" component={IncomingCallScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </TwilioProvider>
    </AuthProvider>
  );
};

export default App;