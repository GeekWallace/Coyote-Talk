import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, FlatList, Alert, Modal, TextInput, Button } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  notes?: string;
  tags: string[];
}

const ContactsScreen: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([
    {
      id: '1',
      name: 'John Doe',
      phoneNumber: '+19495394998',
      email: 'john.doe@example.com',
      notes: 'Client from ABC Corp',
      tags: ['client', 'important'],
    },
    {
      id: '2',
      name: 'Jane Smith',
      phoneNumber: '+15559876543',
      email: 'jane.smith@example.com',
      tags: ['personal'],
    },
    {
      id: '3',
      name: 'Bob Johnson',
      phoneNumber: '+15552223333',
      notes: 'Technical support contact',
      tags: ['support', 'work'],
    },
  ]);

  const { user } = useAuth();
  const navigation = useNavigation();

  const [modalVisible, setModalVisible] = useState(false);
  const [newContact, setNewContact] = useState<Partial<Contact>>({ tags: [] });

  const handleCallContact = (contact: Contact) => {
    navigation.navigate('DialPadScreen', { phoneNumber: contact.phoneNumber });
  };

  const handleMessageContact = (contact: Contact) => {
    navigation.navigate('Messages', { recipientPhoneNumber: contact.phoneNumber });
  };
  
  const handleAddContact = () => {
    setModalVisible(true);
  };
  
  const saveContact = () => {
    if (!newContact.name || !newContact.phoneNumber) {
      Alert.alert('Error', 'Name and phone number are required');
      return;
    }
    const id = Math.random().toString(36).substr(2, 9);
    setContacts([...contacts, { ...newContact, id } as Contact]);
    setNewContact({ tags: [] });
    setModalVisible(false);
  };

  const renderContactItem = ({ item }: { item: Contact }) => (
    <View style={styles.contactItem}>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        <Text style={styles.contactPhone}>{item.phoneNumber}</Text>
        {item.email && <Text style={styles.contactEmail}>{item.email}</Text>}
        {item.notes && <Text style={styles.contactNotes}>{item.notes}</Text>}
        <View style={styles.tagsContainer}>
          {item.tags.map(tag => (
            <View key={tag} style={styles.tagBadge}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.contactActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.callButton]}
          onPress={() => handleCallContact(item)}
        >
          <Text style={styles.actionButtonText}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.messageButton]}
          onPress={() => handleMessageContact(item)}
        >
          <Text style={styles.actionButtonText}>Message</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Contacts</Text>

      {contacts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No contacts found</Text>
        </View>
      ) : (
        <FlatList
          data={contacts}
          renderItem={renderContactItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <TouchableOpacity style={styles.addButton} onPress={handleAddContact}>
        <Text style={styles.addButtonText}>+ Add Contact</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Contact</Text>
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={newContact.name}
              onChangeText={text => setNewContact({ ...newContact, name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone Number (e.g., +15551234567)"
              value={newContact.phoneNumber}
              onChangeText={text => setNewContact({ ...newContact, phoneNumber: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Email (optional)"
              value={newContact.email}
              onChangeText={text => setNewContact({ ...newContact, email: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Notes (optional)"
              value={newContact.notes}
              onChangeText={text => setNewContact({ ...newContact, notes: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Tags (comma-separated, e.g., client,important)"
              value={newContact.tags?.join(',')}
              onChangeText={text => setNewContact({ ...newContact, tags: text.split(',').map(t => t.trim()).filter(t => t) })}
            />
            <Button title="Save" onPress={saveContact} />
            <Button title="Cancel" onPress={() => setModalVisible(false)} color="gray" />
          </View>
        </View>
      </Modal>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    paddingBottom: 16,
  },
  contactItem: {
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
  contactInfo: {
    marginBottom: 12,
  },
  contactName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 16,
    marginBottom: 4,
  },
  contactEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  contactNotes: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagBadge: {
    backgroundColor: '#E1F5FE',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#0288D1',
  },
  contactActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  callButton: {
    backgroundColor: '#4CAF50',
  },
  messageButton: {
    backgroundColor: '#2196F3',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#673AB7',
    padding: 12,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    marginBottom: 10,
  },
});

export default ContactsScreen;