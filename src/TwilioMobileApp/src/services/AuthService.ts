import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export interface User {
  id: string;
  username: string;
  role: 'admin' | 'user';
  twilioNumbers: TwilioNumber[];
}

export interface TwilioNumber {
  id: string;
  phoneNumber: string;
  friendlyName: string;
  capabilities: {
    voice: boolean;
    sms: boolean;
  };
}

export interface AuthCredentials {
  username: string;
  password: string;
}

// Mock users for demonstration (in a real app, this would be server-side)
const MOCK_USERS: User[] = [
  {
    id: '1',
    username: 'admin',
    role: 'admin',
    twilioNumbers: [
      {
        id: 'TN1',
        phoneNumber: '+19495394998',
        friendlyName: 'Main Office',
        capabilities: {
          voice: true,
          sms: true,
        },
      },
      {
        id: 'TN2',
        phoneNumber: '+15559876543',
        friendlyName: 'Support Line',
        capabilities: {
          voice: true,
          sms: true,
        },
      },
    ],
  },
  {
    id: '2',
    username: 'user1',
    role: 'user',
    twilioNumbers: [
      {
        id: 'TN3',
        phoneNumber: '+15552223333',
        friendlyName: 'Sales',
        capabilities: {
          voice: true,
          sms: true,
        },
      },
    ],
  },
];

// Mock passwords (in a real app, passwords would be hashed and stored securely)
const MOCK_PASSWORDS: Record<string, string> = {
  admin: 'admin123',
  user1: 'user123',
};

// Storage keys
const USER_STORAGE_KEY = '@twilio_app_user';
const AUTH_TOKEN_KEY = '@twilio_app_auth_token';

class AuthService {
  // Login user
  async login(credentials: AuthCredentials): Promise<User | null> {
    try {
      // In a real app, this would be an API call to a secure backend
      const { username, password } = credentials;
      
      // Check if user exists and password matches
      const user = MOCK_USERS.find(u => u.username === username);
      if (!user || MOCK_PASSWORDS[username] !== password) {
        return null;
      }
      
      // Generate a mock JWT token (in a real app, this would come from the server)
      const token = `mock-jwt-token-${user.id}-${Date.now()}`;
      
      // Store user and token
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      
      return user;
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  }
  
  // Logout user
  async logout(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }
  
  // Check if user is logged in
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      return !!token;
    } catch (error) {
      console.error('Auth check error:', error);
      return false;
    }
  }
  
  // Get current user
  async getCurrentUser(): Promise<User | null> {
    try {
      const userJson = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (!userJson) return null;
      return JSON.parse(userJson) as User;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }
  
  // Get auth token
  async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    } catch (error) {
      console.error('Get token error:', error);
      return null;
    }
  }
  
  // Add a Twilio number to a user (admin only)
  async addTwilioNumber(userId: string, twilioNumber: TwilioNumber): Promise<boolean> {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser || currentUser.role !== 'admin') {
        return false;
      }
      
      // In a real app, this would be an API call to a secure backend
      // For demo purposes, we'll just update the local storage
      const userToUpdate = MOCK_USERS.find(u => u.id === userId);
      if (!userToUpdate) return false;
      
      userToUpdate.twilioNumbers.push(twilioNumber);
      
      // If updating the current user, update storage
      if (currentUser.id === userId) {
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userToUpdate));
      }
      
      return true;
    } catch (error) {
      console.error('Add Twilio number error:', error);
      return false;
    }
  }
  
  // Remove a Twilio number from a user (admin only)
  async removeTwilioNumber(userId: string, twilioNumberId: string): Promise<boolean> {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser || currentUser.role !== 'admin') {
        return false;
      }
      
      // In a real app, this would be an API call to a secure backend
      // For demo purposes, we'll just update the local storage
      const userToUpdate = MOCK_USERS.find(u => u.id === userId);
      if (!userToUpdate) return false;
      
      userToUpdate.twilioNumbers = userToUpdate.twilioNumbers.filter(
        tn => tn.id !== twilioNumberId
      );
      
      // If updating the current user, update storage
      if (currentUser.id === userId) {
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userToUpdate));
      }
      
      return true;
    } catch (error) {
      console.error('Remove Twilio number error:', error);
      return false;
    }
  }
  
  // Get all users (admin only)
  async getAllUsers(): Promise<User[] | null> {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser || currentUser.role !== 'admin') {
        return null;
      }
      
      // In a real app, this would be an API call to a secure backend
      return MOCK_USERS;
    } catch (error) {
      console.error('Get all users error:', error);
      return null;
    }
  }
}

export default new AuthService();