import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Link, Href } from 'expo-router';
import { PersonalScreenStyles as styles } from '../../css/Screens/PersonalScreen.styles';
import { LockIcon, ClipboardIcon, CalendarIcon, ChevronRightIcon, PersonIcon } from '../../components/Icons';
import { colors } from '../../css/colors';

export default function Personal() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Herramientas Personales</Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        <ToolCard
          href="/tools/passwords"
          icon={<LockIcon color={colors.button.primary} size={24} />}
          title="Gestor de Contraseñas"
          description="Guarda tus contraseñas de forma segura"
        />

        <ToolCard
          href="/tools/notes"
          icon={<ClipboardIcon color={colors.button.primary} size={24} />}
          title="Notas"
          description="Tus apuntes e ideas rápidas"
        />

        <ToolCard
          href="/tools/agenda"
          icon={<CalendarIcon color={colors.button.primary} size={24} />}
          title="Agenda"
          description="Organiza tus eventos y recordatorios"
        />

        <ToolCard
          href="/account"
          icon={<PersonIcon color={colors.button.primary} size={24} />}
          title="Cuenta"
          description="Gestiona tus datos personales y sesión"
        />
      </ScrollView>
    </View>
  );
}

interface ToolCardProps {
  href: Href<string | object>;
  icon: React.ReactNode;
  title: string;
  description: string;
}

const ToolCard = ({ href, icon, title, description }: ToolCardProps) => (
  <Link href={href} asChild>
    <Pressable style={styles.card}>
      <View style={styles.cardIcon}>
        {icon}
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDescription}>{description}</Text>
      </View>
      <ChevronRightIcon color={colors.text.secondary} size={20} />
    </Pressable>
  </Link>
);
