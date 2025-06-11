import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Text, Alert, FlatList } from 'react-native';
import { useTwilio } from '../context/TwilioContext';
import { useAuth } from '../context/AuthContext';
import { useRoute } from '@react-navigation/native';

interface Message {
  id: string;
  to: string;
  body: string;
  status: 'sending' | 'sent' | 'delivered' | 'failed';
  timestamp: Date;
}

const MessagingScreen: React.FC = () => {
  const route = useRoute();
  const [recipient, setRecipient] = useState('');
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  
  const { user } = useAuth();
  const { sendMessage } = useTwilio();
  
  useEffect(() => {
    if (route.params?.recipientPhoneNumber) {
      setRecipient(route.params.recipientPhoneNumber);
    }
  }, [route.params?.recipientPhoneNumber]);

  const handleSendMessage = async () => {
    if (!recipient || !messageText) {
      Alert.alert('Missing Information', 'Please enter both recipient and message');
      return;
    }
    
    if (!user || !user.twilioNumbers || user.twilioNumbers.length === 0) {
      Alert.alert('No Twilio Number', 'You need to have a Twilio number assigned to send messages');
      return;
    }
    
    const tempMessage: Message = {
      id: Date.now().toString(),
      to: recipient,
      body: messageText,
      status: 'sending',
      timestamp: new Date(),
    };
    
    setMessages(prev => [tempMessage, ...prev]);
    setIsSending(true);
    
    try {
      const fromNumber = user.twilioNumbers[0].phoneNumber;
      await sendMessage({
        from: fromNumber,
        to: recipient,
        body: messageText,
      });
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempMessage.id 
            ? { ...msg, status: 'sent' } 
            : msg
        )
      );
      setMessageText('');
    } catch (error) {
      console.error('Send message error:', error);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempMessage.id 
            ? { ...msg, status: 'failed' } 
            : msg
        )
      );
      Alert.alert('Message Failed', 'Unable to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };
  
  const renderMessageItem = ({ item }: { item: Message }) => {
    let statusColor = '#999';
    switch (item.status) {
      case 'sent':
        statusColor = '#4CAF50';
        break;
      case 'delivered':
        statusColor = '#2196F3';
        break;
      case 'failed':
        statusColor = '#F44336';
        break;
      default:
        statusColor = '#999';
    }
    
    return (
      <View style={styles.messageItem}>
        <View style={styles.messageHeader}>
          <Text style={styles.messageRecipient}>To: {item.to}</Text>
          <Text style={[styles.messageStatus, { color: statusColor }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
        <Text style={styles.messageBody}>{item.body}</Text>
        <Text style={styles.messageTime}>
          {item.timestamp.toLocaleTimeString()} - {item.timestamp.toLocaleDateString()}
        </Text>
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Messages</Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.recipientInput}
          value={recipient}
          onChangeText={setRecipient}
          placeholder="Recipient phone number"
          keyboardType="phone-pad"
        />
        
        <TextInput
          style={styles.messageInput}
          value={messageText}
          onChangeText={setMessageText}
          placeholder="Type your message here"
          multiline
        />
        
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!recipient || !messageText || isSending) && styles.sendButtonDisabled
          ]}
          onPress={handleSendMessage}
          disabled={!recipient || !messageText || isSending}
        >
          <Text style={styles.sendButtonText}>
            {isSending ? 'Sending...' : 'Send Message'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.messagesContainer}>
        <Text style={styles.messagesTitle}>Recent Messages</Text>
        
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No messages yet</Text>
          </View>
        ) : (
          <FlatList
            data={messages}
            renderItem={renderMessageItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messagesList}
          />
        )}
      </View>
    </View>
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
  inputContainer: {
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
  recipientInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    marginBottom: 12,
    fontSize: 16,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    marginBottom: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  sendButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#B0BEC5',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  messagesList: {
    paddingBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  messageItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  messageRecipient: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  messageStatus: {
    fontSize: 14,
  },
  messageBody: {
    fontSize: 16,
    marginBottom: 8,
  },
  messageTime: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
});

export default MessagingScreen;