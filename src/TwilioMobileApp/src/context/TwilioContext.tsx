import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import TwilioService, { TwilioConfig, CallOptions, MessageOptions, VoicemailOptions } from '../services/TwilioService';
import { useAuth } from './AuthContext';

interface TwilioContextType {
  isInitialized: boolean;
  initializeTwilio: (config: TwilioConfig) => boolean;
  makeCall: (options: CallOptions) => Promise<any>;
  sendMessage: (options: MessageOptions) => Promise<any>;
  callWithVoicemail: (options: VoicemailOptions) => Promise<any>;
  getVoicemailRecordings: (callSid: string) => Promise<any[]>;
  getAllVoicemailRecordings: () => Promise<any[]>;
  getCallLogs: () => Promise<any[]>;
  getMessageLogs: () => Promise<any[]>;
}

const TwilioContext = createContext<TwilioContextType>({
  isInitialized: false,
  initializeTwilio: () => false,
  makeCall: async () => ({}),
  sendMessage: async () => ({}),
  callWithVoicemail: async () => ({}),
  getVoicemailRecordings: async () => [],
  getAllVoicemailRecordings: async () => [],
  getCallLogs: async () => [],
  getMessageLogs: async () => [],
});

export const useTwilio = () => useContext(TwilioContext);

interface TwilioProviderProps {
  children: ReactNode;
}

export const TwilioProvider: React.FC<TwilioProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      setIsInitialized(false);
    } else if (user && !isInitialized) {
      const config = { accountSid: process.env.TWILIO_ACCOUNT_SID || '', authToken: process.env.TWILIO_AUTH_TOKEN || '' };
      setIsInitialized(TwilioService.initialize(config));
    }
  }, [isAuthenticated, user, isInitialized]);

  const initializeTwilio = (config: TwilioConfig): boolean => {
    try {
      const result = TwilioService.initialize(config);
      setIsInitialized(result);
      return result;
    } catch (error) {
      console.error('Twilio initialization error:', error);
      setIsInitialized(false);
      return false;
    }
  };

  const makeCall = async (options: CallOptions): Promise<any> => {
    if (!isInitialized) throw new Error('Twilio not initialized');
    return await TwilioService.makeCall(options);
  };

  const sendMessage = async (options: MessageOptions): Promise<any> => {
    if (!isInitialized) throw new Error('Twilio not initialized');
    return await TwilioService.sendMessage(options);
  };

  const callWithVoicemail = async (options: VoicemailOptions): Promise<any> => {
    if (!isInitialized) throw new Error('Twilio not initialized');
    return await TwilioService.callWithVoicemail(options);
  };

  const getVoicemailRecordings = async (callSid: string): Promise<any[]> => {
    if (!isInitialized) throw new Error('Twilio not initialized');
    return await TwilioService.getVoicemailRecordings(callSid);
  };

  const getAllVoicemailRecordings = async (): Promise<any[]> => {
    if (!isInitialized) throw new Error('Twilio not initialized');
    return await TwilioService.getAllVoicemailRecordings();
  };

  const getCallLogs = async (): Promise<any[]> => {
    if (!isInitialized) throw new Error('Twilio not initialized');
    return await TwilioService.getCallLogs();
  };

  const getMessageLogs = async (): Promise<any[]> => {
    if (!isInitialized) throw new Error('Twilio not initialized');
    return await TwilioService.getMessageLogs();
  };

  return (
    <TwilioContext.Provider
      value={{
        isInitialized,
        initializeTwilio,
        makeCall,
        sendMessage,
        callWithVoicemail,
        getVoicemailRecordings,
        getAllVoicemailRecordings,
        getCallLogs,
        getMessageLogs,
      }}
    >
      {children}
    </TwilioContext.Provider>
  );
};