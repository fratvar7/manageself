import React from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { TasksService } from '../services/tasksService';
import { useAuth } from '../contexts/AuthContext';

export const createExampleHabits = async () => {
  const { user } = useAuth();
  if (!user) return;

  const exampleHabits = [
    {
      title: 'Correr 5km',
      description: 'Correr 5 kilómetros por la mañana',
      icon: 'physics',
      color: '#e74c3c',
    },
    {
      title: 'Leer 20 páginas',
      description: 'Leer un libro durante 20 minutos',
      icon: 'mental',
      color: '#9b59b6',
    },
    {
      title: 'Escribir diario',
      description: 'Escribir sobre mis emociones del día',
      icon: 'emotional',
      color: '#e91e63',
    },
    {
      title: 'Meditar con música',
      description: 'Meditar 10 minutos con música relajante',
      icon: 'spiritual',
      color: '#fabb0a',
    },
    {
      title: 'Llamar a un amigo',
      description: 'Contactar con un ser querido',
      icon: 'social',
      color: '#ff9800',
    },
    {
      title: 'Curso online',
      description: 'Avanzar en mi curso profesional',
      icon: 'professional',
      color: '#4caf50',
    },
    {
      title: 'Revisar presupuesto',
      description: 'Revisar gastos e ingresos del día',
      icon: 'economic',
      color: '#f39c12',
    },
    {
      title: 'Dibujar algo',
      description: 'Crear un dibujo o sketch rápido',
      icon: 'creative',
      color: '#e74c3c',
    },
  ];

  try {
    for (const habit of exampleHabits) {
      await TasksService.createHabit(user.uid, habit);
    }
    Alert.alert('Éxito', 'Se han creado 8 hábitos de ejemplo');
  } catch (error) {
    Alert.alert('Error', 'No se pudieron crear los hábitos de ejemplo');
    console.error('Error creating example habits:', error);
  }
};

// Componente para mostrar el botón de crear ejemplos
export const ExampleHabitsButton = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <Pressable
      style={{
        backgroundColor: '#3498db',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginVertical: 8,
      }}
      onPress={createExampleHabits}
    >
      <Text style={{ color: 'white', fontWeight: '600' }}>
        Crear Hábitos de Ejemplo
      </Text>
    </Pressable>
  );
};
