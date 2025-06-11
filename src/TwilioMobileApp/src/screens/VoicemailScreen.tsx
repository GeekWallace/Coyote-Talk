import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useTwilio } from '../context/TwilioContext';

interface VoicemailItem {
  sid: string;
  dateCreated: string;
  duration: string;
  from: string;
  status: string;
  url: string;
}

const VoicemailScreen: React.FC = () => {
  const [voicemails, setVoicemails] = useState<VoicemailItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayingSid, setCurrentPlayingSid] = useState<string | null>(null);
  
  const { getAllVoicemailRecordings } = useTwilio();
  
  useEffect(() => {
    loadVoicemails();
  }, []);
  
  const loadVoicemails = async () => {
    setIsLoading(true);
    try {
      const recordings = await getAllVoicemailRecordings();
      
      // Transform the recordings into our VoicemailItem format
      const formattedVoicemails: VoicemailItem[] = recordings.map(recording => ({
        sid: recording.sid,
        dateCreated: new Date(recording.dateCreated).toLocaleString(),
        duration: `${Math.floor(recording.duration / 60)}:${(recording.duration % 60).toString().padStart(2, '0')}`,
        from: recording.from || 'Unknown',
        status: recording.status,
        url: recording.url,
      }));
      
      setVoicemails(formattedVoicemails);
    } catch (error) {
      console.error('Failed to load voicemails:', error);
      Alert.alert('Error', 'Failed to load voicemails. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePlayVoicemail = (voicemail: VoicemailItem) => {
    // In a real app, you would implement audio playback here
    // For this demo, we'll just simulate playback
    setIsPlaying(true);
    setCurrentPlayingSid(voicemail.sid);
    
    // Simulate playback completion after the duration
    setTimeout(() => {
      setIsPlaying(false);
      setCurrentPlayingSid(null);
    }, 3000);
    
    Alert.alert('Playing Voicemail', `Now playing voicemail from ${voicemail.from}`);
  };
  
  const handleDeleteVoicemail = (voicemail: VoicemailItem) => {
    // In a real app, you would implement deletion via Twilio API
    // For this demo, we'll just remove it from the local state
    Alert.alert(
      'Delete Voicemail',
      `Are you sure you want to delete this voicemail from ${voicemail.from}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: () => {
            setVoicemails(prev => prev.filter(vm => vm.sid !== voicemail.sid));
          },
          style: 'destructive',
        },
      ]
    );
  };
  
  const renderVoicemailItem = ({ item }: { item: VoicemailItem }) => {
    const isCurrentlyPlaying = isPlaying && currentPlayingSid === item.sid;
    
    return (
      <View style={styles.voicemailItem}>
        <View style={styles.voicemailInfo}>
          <Text style={styles.fromText}>{item.from}</Text>
          <Text style={styles.dateText}>{item.dateCreated}</Text>
          <Text style={styles.durationText}>Duration: {item.duration}</Text>
        </View>
        <View style={styles.voicemailActions}>
          <TouchableOpacity
            style={[styles.actionButton, isCurrentlyPlaying ? styles.playingButton : styles.playButton]}
            onPress={() => handlePlayVoicemail(item)}
            disabled={isPlaying}
          >
            <Text style={styles.actionButtonText}>
              {isCurrentlyPlaying ? 'Playing...' : 'Play'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteVoicemail(item)}
          >
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Voicemail</Text>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text>Loading voicemails...</Text>
        </View>
      ) : voicemails.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No voicemails found</Text>
        </View>
      ) : (
        <FlatList
          data={voicemails}
          renderItem={renderVoicemailItem}
          keyExtractor={item => item.sid}
          contentContainerStyle={styles.listContainer}
        />
      )}
      
      <TouchableOpacity
        style={styles.refreshButton}
        onPress={loadVoicemails}
        disabled={isLoading}
      >
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  voicemailItem: {
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
  voicemailInfo: {
    marginBottom: 12,
  },
  fromText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  durationText: {
    fontSize: 14,
    color: '#666',
  },
  voicemailActions: {
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
  playButton: {
    backgroundColor: '#4CAF50',
  },
  playingButton: {
    backgroundColor: '#8BC34A',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  refreshButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default VoicemailScreen;