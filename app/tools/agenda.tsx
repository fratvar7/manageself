import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CalendarView } from '../../components/CalendarView';

export default function AgendaScreen() {
  return (
    <View style={styles.container}>
      <CalendarView />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
});
