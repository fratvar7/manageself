// Paleta de colores "Midnight Vibrancy" - Menos gris, más color y profundidad
// Tema inspirado en interfaces Cyberpunk/Futuristas pero limpias

export const colors = {
  // Fondos - Ahora con tinte azul profundo/nocturno en lugar de gris plano
  background: {
    primary: '#0B0C15',      // "Midnight Black" - Base profunda con toque azul
    secondary: '#151621',    // "Deep Navy" - Elementos nivel 1
    tertiary: '#202230',     // "Night Blue" - Elementos nivel 2
    elevated: '#2A2D3D',     // "Twilight" - Modales y popups
    card: '#151621',         // Alias de secondary para tarjetas
    glass: 'rgba(30, 32, 50, 0.7)', // Glassmorphism con tinte azulado
  },

  // Texto - Optimizado para contraste en fondos azules
  text: {
    primary: '#FFFFFF',      // Blanco puro
    secondary: '#94A3B8',    // "Slate" - Gris azulado frío
    tertiary: '#64748B',     // "Slate Dark"
    disabled: '#475569',     // Alias
    inverse: '#0F172A',      // Azul muy oscuro para texto en fondos claros
    dark: '#0F172A',         // Alias
  },

  // Acento principal - Neón y vibrante
  accent: {
    primary: '#3B82F6',      // Azul Eléctrico
    primaryLight: '#60A5FA', // Azul Cielo brillante
    primaryDark: '#2563EB',  // Azul Real profundo
    primarySoft: 'rgba(59, 130, 246, 0.15)', // Resplandor azul

    // Colores secundarios "Neon"
    violet: '#8B5CF6',       // Violeta (queda como secundario)
    cyan: '#06B6D4',         // Cian eléctrico
    mint: '#10B981',         // Esmeralda
    lightmint: '#34D399',    // Alias
    pink: '#EC4899',         // Rosa neón
    purple: '#D946EF',       // Fuchsia
    coral: '#F97316',        // Naranja brillante
    yellow: '#EAB308',       // Oro
  },

  // Estados
  status: {
    success: '#10B981',
    successLight: '#34D399',
    successSoft: 'rgba(16, 185, 129, 0.15)',

    warning: '#F59E0B',
    warningLight: '#FBBF24',
    warningSoft: 'rgba(245, 158, 11, 0.15)',

    error: '#EF4444',
    errorLight: '#F87171',
    errorSoft: 'rgba(239, 68, 68, 0.15)',

    info: '#3B82F6',
    infoSoft: 'rgba(59, 130, 246, 0.15)',
  },

  // Gradientes
  gradient: {
    primary: ['#3B82F6', '#06B6D4'],     // Azul a Cyan (Ocean Tech)
    success: ['#059669', '#10B981'],     // Verde bosque a Esmeralda
    expense: ['#DC2626', '#EA580C'],     // Rojo a Naranja quemado
    gold: ['#D97706', '#FBBF24'],        // Bronce a Oro
    ocean: ['#0F172A', '#1E293B'],       // Gradiente sutil para fondos de tarjetas
    card: ['#151621', '#1E2030'],        // Gradiente sutil para tarjetas
  },

  // Bordes
  border: {
    default: 'rgba(148, 163, 184, 0.1)', // Azul grisáceo sutil
    light: 'rgba(148, 163, 184, 0.2)',
    accent: 'rgba(59, 130, 246, 0.5)',   // Borde brilla con el acento azul
  },

  // Sombras
  shadow: {
    default: 'rgba(0, 0, 0, 0.6)',
    colored: 'rgba(59, 130, 246, 0.25)', // Sombra con color del acento azul
    card: 'rgba(0, 0, 0, 0.3)',
  },

  // Botones
  button: {
    primary: '#3B82F6',
    primaryHover: '#2563EB',
    secondary: '#1E293B',
    secondaryHover: '#334155',
  },
};
