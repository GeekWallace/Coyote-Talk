import React, { useState } from 'react';
import { View, StyleSheet, Text, Switch, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTwilio } from '../context/TwilioContext';

const SettingsScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const { isInitialized } = useTwilio();
  
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [enableVoicemail, setEnableVoicemail] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  
  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            await logout();
            // Navigation will be handled by the AuthContext
          },
          style: 'destructive',
        },
      ]
    );
  };
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <View style={styles.userInfo}>
          <Text style={styles.username}>
            {user ? user.username : 'Not logged in'}
          </Text>
          <Text style={styles.role}>
            Role: {user ? user.role : 'N/A'}
          </Text>
          <Text style={styles.connectionStatus}>
            Twilio Connection: {isInitialized ? 'Connected' : 'Disconnected'}
          </Text>
        </View>
        
        {user && user.twilioNumbers && user.twilioNumbers.length > 0 && (
          <View style={styles.numbersContainer}>
            <Text style={styles.numbersTitle}>Your Twilio Numbers:</Text>
            {user.twilioNumbers.map(number => (
              <View key={number.id} style={styles.numberItem}>
                <Text style={styles.numberName}>{number.friendlyName}</Text>
                <Text style={styles.numberPhone}>{number.phoneNumber}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Enable Notifications</Text>
          <Switch
            value={enableNotifications}
            onValueChange={setEnableNotifications}
          />
        </View>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Enable Voicemail</Text>
          <Switch
            value={enableVoicemail}
            onValueChange={setEnableVoicemail}
          />
        </View>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Dark Mode</Text>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
          />
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>
          Twilio Mobile App v1.0.0
        </Text>
        <Text style={styles.aboutText}>
          A cross-platform mobile application for making calls and sending text messages using Twilio.
        </Text>
      </View>
      
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  userInfo: {
    marginBottom: 16,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  role: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  connectionStatus: {
    fontSize: 16,
    color: '#666',
  },
  numbersContainer: {
    marginTop: 8,
  },
  numbersTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  numberItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
    padding: 8,
    marginBottom: 8,
  },
  numberName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  numberPhone: {
    fontSize: 14,
    color: '#666',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingLabel: {
    fontSize: 16,
  },
  aboutText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  logoutButton: {
    backgroundColor: '#F44336',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SettingsScreen;