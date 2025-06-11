import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Voice, CallInvite } from '@twilio/voice-react-native-sdk';
import RNCallKeep from 'react-native-callkeep';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { useAuth } from '../context/AuthContext';
import { useTwilio } from '../context/TwilioContext';

const IncomingCallScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { isInitialized, initializeTwilio } = useTwilio();
  const [callData, setCallData] = useState<{ callSid: string; from: string; to: string } | null>(null);
  const [voice, setVoice] = useState<Voice | null>(null);
  const [callInvite, setCallInvite] = useState<CallInvite | null>(null);

  useEffect(() => {
    const initVoice = async () => {
      if (!isInitialized && user) {
        const token = await fetchTwilioToken(user.id);
        if (token) {
          initializeTwilio({});
          const voiceInstance = new Voice();
          setVoice(voiceInstance);
          await voiceInstance.register(token);

          const fcmToken = await messaging().getToken();
          await fetch(`${process.env.REACT_NATIVE_BACKEND_URL}/api/register-device`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': 'mySecureKey12345',
            },
            body: JSON.stringify({ identity: user.id, fcmToken }),
          });
        }
      }
    };
    initVoice();

    const unsubscribeMessage = messaging().onMessage(async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
      if (remoteMessage.data?.type === 'incoming_call') {
        const data = remoteMessage.data as { callSid: string; from: string; to: string };
        if (data.callSid && data.from && data.to) {
          setCallData({
            callSid: data.callSid,
            from: data.from,
            to: data.to,
          });
          RNCallKeep.displayIncomingCall(data.callSid, data.from, data.from, 'generic');
        }
      }
    });

    let voiceInstance: Voice | null = null;
    if (voice) {
      voiceInstance = voice;
      voiceInstance.on('callInvite', (invite: CallInvite) => {
        setCallInvite(invite);
        setCallData({
          callSid: invite.callSid,
          from: invite.from,
          to: invite.to,
        });
        RNCallKeep.displayIncomingCall(invite.callSid, invite.from, invite.from, 'generic');
      });
    }

    const unsubscribeAnswer = RNCallKeep.addEventListener('answerCall', ({ callUUID }) => {
      handleAcceptCall(callUUID);
    });
    const unsubscribeEnd = RNCallKeep.addEventListener('endCall', ({ callUUID }) => {
      handleRejectCall(callUUID);
    });

    return () => {
      unsubscribeMessage();
      unsubscribeAnswer.remove();
      unsubscribeEnd.remove();
      if (voiceInstance) {
        voiceInstance.removeAllListeners('callInvite');
      }
    };
  }, [isInitialized, user, voice]);

  const fetchTwilioToken = async (identity: string): Promise<string | null> => {
    try {
      const response = await fetch(`${process.env.REACT_NATIVE_BACKEND_URL}/api/twilio-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'mySecureKey12345',
        },
        body: JSON.stringify({ identity }),
      });
      const data = await response.json();
      return data.token;
    } catch (error) {
      console.error('Error fetching Twilio token:', error);
      return null;
    }
  };

  const handleAcceptCall = async (callUUID: string) => {
    if (callInvite && callData) {
      try {
        const call = await callInvite.accept();
        call.on('disconnect', () => {
          RNCallKeep.endCall(callUUID);
          setCallData(null);
          setCallInvite(null);
          navigation.goBack();
        });
      } catch (error) {
        console.error('Error accepting call:', error);
        Alert.alert('Error', 'Failed to accept call');
        RNCallKeep.endCall(callUUID);
        setCallData(null);
        setCallInvite(null);
        navigation.goBack();
      }
    }
  };

  const handleRejectCall = (callUUID: string) => {
    if (callInvite) {
      callInvite.reject();
    }
    RNCallKeep.endCall(callUUID);
    setCallData(null);
    setCallInvite(null);
    navigation.goBack();
  };

  if (!callData) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Incoming Call</Text>
      <Text style={styles.callerInfo}>From: {callData.from}</Text>
      <Text style={styles.callerInfo}>To: {callData.to}</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.acceptButton]}
          onPress={() => handleAcceptCall(callData.callSid)}
        >
          <Text style={styles.buttonText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.rejectButton]}
          onPress={() => handleRejectCall(callData.callSid)}
        >
          <Text style={styles.buttonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  callerInfo: {
    fontSize: 18,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
  },
  button: {
    padding: 15,
    borderRadius: 8,
    width: '45%',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default IncomingCallScreen;