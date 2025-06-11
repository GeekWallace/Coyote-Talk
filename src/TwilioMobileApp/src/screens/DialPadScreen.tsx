import React from 'react';
import { View, StyleSheet } from 'react-native';
import DialPad from '../components/DialPad';

const DialPadScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <DialPad />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

export default DialPadScreen;