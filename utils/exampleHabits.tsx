import { TasksService } from '../services/tasksService';

// Función para crear hábitos de ejemplo de cada categoría
export const createExampleHabits = async (userId: string) => {
  const exampleHabits = [
    {
      title: 'Correr 5km',
      description: 'Correr 5 kilómetros por la mañana',
      icon: 'physics',
      color: '#e74c3c',
      isDefault: false,
    },
    {
      title: 'Leer 20 páginas',
      description: 'Leer un libro durante 20 minutos',
      icon: 'mental',
      color: '#9b59b6',
      isDefault: false,
    },
    {
      title: 'Escribir diario',
      description: 'Escribir sobre mis emociones del día',
      icon: 'emotional',
      color: '#e91e63',
      isDefault: false,
    },
    {
      title: 'Meditar con música',
      description: 'Meditar 10 minutos con música relajante',
      icon: 'spiritual',
      color: '#fabb0a',
      isDefault: false,
    },
    {
      title: 'Llamar a un amigo',
      description: 'Contactar con un ser querido',
      icon: 'social',
      color: '#ff9800',
      isDefault: false,
    },
    {
      title: 'Curso online',
      description: 'Avanzar en mi curso profesional',
      icon: 'professional',
      color: '#4caf50',
      isDefault: false,
    },
    {
      title: 'Revisar presupuesto',
      description: 'Revisar gastos e ingresos del día',
      icon: 'economic',
      color: '#f39c12',
      isDefault: false,
    },
    {
      title: 'Dibujar algo',
      description: 'Crear un dibujo o sketch rápido',
      icon: 'creative',
      color: '#e74c3c',
      isDefault: false,
    },
  ];

  try {
    for (const habit of exampleHabits) {
      await TasksService.createHabit(userId, habit);
    }
    return { success: true, message: 'Se han creado 8 hábitos de ejemplo' };
  } catch (error) {
    console.error('Error creating example habits:', error);
    return { success: false, message: 'No se pudieron crear los hábitos de ejemplo' };
  }
};
