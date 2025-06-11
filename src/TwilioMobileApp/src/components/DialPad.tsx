import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Text, Alert, ScrollView } from 'react-native';
import { useTwilio } from '../context/TwilioContext';
import { useAuth } from '../context/AuthContext';
import { useRoute, RouteProp } from '@react-navigation/native';

type DialPadRouteParams = {
  phoneNumber?: string;
};

const DialPad: React.FC = () => {
  const route = useRoute<RouteProp<Record<string, DialPadRouteParams>, string>>();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isCallInProgress, setIsCallInProgress] = useState(false);
  const [activeNumber, setActiveNumber] = useState('');
  
  const { user } = useAuth();
  const { makeCall, callWithVoicemail } = useTwilio();

  useEffect(() => {
    if (route.params?.phoneNumber) {
      setPhoneNumber(route.params.phoneNumber);
    }
  }, [route.params?.phoneNumber]);
  
  const handleNumberPress = (num: string) => {
    setPhoneNumber(prev => prev + num);
  };
  
  const handleBackspace = () => {
    setPhoneNumber(prev => prev.slice(0, -1));
  };
  
  const handleCall = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid phone number');
      return;
    }
    
    if (!user || !user.twilioNumbers || user.twilioNumbers.length === 0) {
      Alert.alert('No Twilio Number', 'You need to have a Twilio number assigned to make calls');
      return;
    }
    
    try {
      setIsCallInProgress(true);
   
      
      // Use the first Twilio number for simplicity
      // In a real app, you would let the user choose which number to use
      const fromNumber = user.twilioNumbers[0].phoneNumber;
      setActiveNumber(fromNumber);
      
      // Use callWithVoicemail to enable voicemail functionality
      await callWithVoicemail({
        from: fromNumber,
        to: phoneNumber,
        timeout: 15, // seconds before going to voicemail
      });
      
      // In a real app, you would handle call state management here
      
    } catch (error) {
      console.error('Call error:', error);
      Alert.alert('Call Failed', 'Unable to place call. Please try again.');
    } finally {
      setIsCallInProgress(false);
    }
  };
  
  const handleEndCall = () => {
    // In a real app, you would implement call termination logic here
    setIsCallInProgress(false);
    Alert.alert('Call Ended', 'The call has been terminated');
  };
  
  const renderDialPad = () => {
    const numbers = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['*', '0', '#']
    ];
    
    return (
      <View style={styles.dialPadContainer}>
        {numbers.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.dialPadRow}>
            {row.map(num => (
              <TouchableOpacity
                key={`num-${num}`}
                style={styles.dialPadButton}
                onPress={() => handleNumberPress(num)}
                disabled={isCallInProgress}
              >
                <Text style={styles.dialPadButtonText}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    );
  };
  
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.phoneNumberContainer}>
        <TextInput
          style={styles.phoneNumberInput}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          editable={!isCallInProgress}
          placeholder="Enter phone number"
        />
        <TouchableOpacity
          style={styles.backspaceButton}
          onPress={handleBackspace}
          disabled={isCallInProgress || !phoneNumber}
        >
          <Text style={styles.backspaceButtonText}>⌫</Text>
        </TouchableOpacity>
      </View>
      
      {renderDialPad()}
      
      <View style={styles.callButtonsContainer}>
        {!isCallInProgress ? (
          <TouchableOpacity
            style={[styles.callButton, styles.callButtonGreen]}
            onPress={handleCall}
            disabled={!phoneNumber}
          >
            <Text style={styles.callButtonText}>Call</Text>
          </TouchableOpacity>
        ) : (
          <>
            <Text style={styles.activeCallText}>
              Calling from {activeNumber} to {phoneNumber}
            </Text>
            <TouchableOpacity
              style={[styles.callButton, styles.callButtonRed]}
              onPress={handleEndCall}
            >
              <Text style={styles.callButtonText}>End Call</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  phoneNumberContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
  },
  phoneNumberInput: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 18,
    backgroundColor: '#fff',
  },
  backspaceButton: {
    marginLeft: 10,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
  },
  backspaceButtonText: {
    fontSize: 24,
  },
  dialPadContainer: {
    marginBottom: 20,
  },
  dialPadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  dialPadButton: {
    width: '30%',
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 35,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dialPadButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  callButtonsContainer: {
    alignItems: 'center',
  },
  callButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  callButtonGreen: {
    backgroundColor: '#4CAF50',
  },
  callButtonRed: {
    backgroundColor: '#F44336',
  },
  callButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  activeCallText: {
    marginBottom: 15,
    fontSize: 16,
    color: '#555',
  },
});

export default DialPad;