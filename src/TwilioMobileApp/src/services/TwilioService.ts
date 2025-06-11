// @ts-ignore
import { REACT_NATIVE_BACKEND_URL, REACT_NATIVE_API_KEY } from '@env';

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
}

export interface CallOptions {
  from: string;
  to: string;
  url?: string;
  statusCallback?: string;
  record?: boolean;
}

export interface MessageOptions {
  from: string;
  to: string;
  body: string;
  mediaUrl?: string[];
  statusCallback?: string;
}

export interface VoicemailOptions {
  from: string;
  to: string;
  fallbackUrl: string;
  timeout: number;
}

export interface DeleteResponse {
  success: boolean;
  message: string;
}

class TwilioService {
  private baseUrl = REACT_NATIVE_BACKEND_URL || 'https://ed23-185-203-122-87.ngrok-free.app';
  private apiKey = REACT_NATIVE_API_KEY || '';

  private async request(endpoint: string, method: string, body?: any): Promise<any> {
    const headers = { 'Content-Type': 'application/json', 'x-api-key': this.apiKey };
    const response = await fetch(`${this.baseUrl}${endpoint}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Request failed');
    return data;
  }

  initialize(config: TwilioConfig): boolean {
    console.log('Twilio initialized with config:', config);
    return true;
  }

  isInitialized(): boolean {
    return true;
  }

  async makeCall(options: CallOptions): Promise<any> {
    const data = await this.request('/api/make-call', 'POST', {
      ...options,
      url: `${this.baseUrl}/api/voice-outbound`,
    });
    return { sid: data.callSid };
  }

  async getTwilioToken(identity: string): Promise<string | null> {
    try {
      const data = await this.request('/api/twilio-token', 'POST', { identity });
      return data.token;
    } catch (error) {
      console.error('Error fetching Twilio token:', error);
      return null;
    }
  }

  async sendMessage(options: MessageOptions): Promise<any> {
    const data = await this.request('/api/send-message', 'POST', options);
    return { sid: data.messageSid };
  }

  async callWithVoicemail(options: VoicemailOptions): Promise<any> {
    const data = await this.request('/api/call-with-voicemail', 'POST', {
      ...options,
      fallbackUrl: `${this.baseUrl}/api/voicemail-handler`,
    });
    return { sid: data.callSid };
  }

  async getVoicemailRecordings(callSid: string): Promise<any[]> {
    const data = await this.request(`/api/voicemail-recordings/${callSid}`, 'GET');
    return data.recordings;
  }

  async getAllVoicemailRecordings(): Promise<any[]> {
    const data = await this.request('/api/all-voicemail-recordings', 'GET');
    return data.recordings;
  }

  async getCallLogs(): Promise<any[]> {
    const data = await this.request('/api/call-logs', 'GET');
    return data.calls;
  }

  async getMessageLogs(): Promise<any[]> {
    const data = await this.request('/api/message-logs', 'GET');
    return data.messages;
  }

  async deleteVoicemail(sid: string): Promise<DeleteResponse> {
    try {
      const data = await this.request(`/api/voicemail/${sid}`, 'DELETE');
      return data;
    } catch (error) {
      console.error('Error deleting voicemail:', error);
      throw error;
    }
  }
}

console.log('Base URL:', REACT_NATIVE_BACKEND_URL);
console.log('API Key:', REACT_NATIVE_API_KEY);

export default new TwilioService();