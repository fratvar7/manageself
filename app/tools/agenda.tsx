import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../css/colors';

export default function AgendaScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Agenda (Próximamente)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: colors.text.secondary,
    fontSize: 18,
  },
});
