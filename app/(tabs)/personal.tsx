import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { PersonalScreenStyles as styles } from '../../css/Screens/PersonalScreen.styles';

export default function Personal() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Personal</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Herramientas Personales</Text>
        <Text style={styles.cardText}>Gestiona tus tareas, contraseñas, notas y más.</Text>
      </View>

      <Link asChild href="/">
        <Pressable style={styles.card}>
          <Text style={styles.cardTitle}>📅 Agendar</Text>
          <Text style={styles.cardText}>Organiza tu tiempo y eventos</Text>
        </Pressable>
      </Link>

      <Link asChild href="/">
        <Pressable style={styles.card}>
          <Text style={styles.cardTitle}>🔐 Contraseñas</Text>
          <Text style={styles.cardText}>Gestiona tus contraseñas de forma segura</Text>
        </Pressable>
      </Link>

      <Link asChild href="/">
        <Pressable style={styles.card}>
          <Text style={styles.cardTitle}>📝 Notas</Text>
          <Text style={styles.cardText}>Toma notas y organiza tus ideas</Text>
        </Pressable>
      </Link>
    </View>
  );
}
