import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NotesList } from '../../components/NotesList';

export default function NotesScreen() {
  return (
    <View style={styles.container}>
      <NotesList />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
});
