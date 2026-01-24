import { LibraryExercise } from '../types';

export const GYM_EXERCISES: LibraryExercise[] = [
  // PECHO
  { id: 'chest_bench_press', name: 'Press de Banca con Barra', muscleGroup: 'Pecho', equipment: 'Barra' },
  { id: 'chest_bench_press_db', name: 'Press de Banca con Mancuernas', muscleGroup: 'Pecho', equipment: 'Mancuernas' },
  { id: 'chest_incline_bench_press', name: 'Press Superior con Barra', muscleGroup: 'Pecho', equipment: 'Barra' },
  { id: 'chest_incline_bench_press_db', name: 'Press Superior con Mancuernas', muscleGroup: 'Pecho', equipment: 'Mancuernas' },
  { id: 'chest_decline_bench_press', name: 'Press Declinado con Barra', muscleGroup: 'Pecho', equipment: 'Barra' },
  { id: 'chest_flys', name: 'Aperturas con Mancuernas', muscleGroup: 'Pecho', equipment: 'Mancuernas' },
  { id: 'chest_cable_crossover', name: 'Cruce de Poleas', muscleGroup: 'Pecho', equipment: 'Polea' },
  { id: 'chest_pushups', name: 'Flexiones', muscleGroup: 'Pecho', equipment: 'Peso Corporal' },
  { id: 'chest_machine_press', name: 'Press en Máquina', muscleGroup: 'Pecho', equipment: 'Máquina' },

  // ESPALDA
  { id: 'back_deadlift', name: 'Peso Muerto', muscleGroup: 'Espalda', equipment: 'Barra' },
  { id: 'back_pullups', name: 'Dominadas', muscleGroup: 'Espalda', equipment: 'Peso Corporal' },
  { id: 'back_lat_pulldown', name: 'Jalón al Pecho', muscleGroup: 'Espalda', equipment: 'Polea' },
  { id: 'back_seated_row', name: 'Remo en Polea Baja', muscleGroup: 'Espalda', equipment: 'Polea' },
  { id: 'back_dumbbell_row', name: 'Remo con Mancuerna', muscleGroup: 'Espalda', equipment: 'Mancuernas' },
  { id: 'back_tbar_row', name: 'Remo en T', muscleGroup: 'Espalda', equipment: 'Barra' },
  { id: 'back_hyperextensions', name: 'Hiperextensiones', muscleGroup: 'Espalda', equipment: 'Peso Corporal' },

  // PIERNA
  { id: 'leg_squat', name: 'Sentadilla con Barra', muscleGroup: 'Pierna', equipment: 'Barra' },
  { id: 'leg_hack_squat', name: 'Sentadilla Hack', muscleGroup: 'Pierna', equipment: 'Máquina' },
  { id: 'leg_press', name: 'Prensa de Piernas', muscleGroup: 'Pierna', equipment: 'Máquina' },
  { id: 'leg_extension', name: 'Extensiones de Cuádriceps', muscleGroup: 'Pierna', equipment: 'Máquina' },
  { id: 'leg_curl', name: 'Curl Femoral', muscleGroup: 'Pierna', equipment: 'Máquina' },
  { id: 'leg_stiff_deadlift', name: 'Peso Muerto Rumano', muscleGroup: 'Pierna', equipment: 'Barra' },
  { id: 'leg_lunges', name: 'Zancadas', muscleGroup: 'Pierna', equipment: 'Mancuernas' },
  { id: 'leg_calf_raise', name: 'Elevación de Gemelos', muscleGroup: 'Pierna', equipment: 'Mancuernas' },
  { id: 'leg_hip_thrust', name: 'Hip Thrust', muscleGroup: 'Pierna', equipment: 'Barra' },

  // HOMBRO
  { id: 'shoulder_overhead_press', name: 'Press Militar', muscleGroup: 'Hombro', equipment: 'Barra' },
  { id: 'shoulder_seated_dumbbell_press', name: 'Press de Hombros con Mancuernas', muscleGroup: 'Hombro', equipment: 'Mancuernas' },
  { id: 'shoulder_lateral_raise', name: 'Elevaciones Laterales', muscleGroup: 'Hombro', equipment: 'Mancuernas' },
  { id: 'shoulder_front_raise', name: 'Elevaciones Frontales', muscleGroup: 'Hombro', equipment: 'Mancuernas' },
  { id: 'shoulder_rear_delt_fly', name: 'Pájaro', muscleGroup: 'Hombro', equipment: 'Mancuernas' },
  { id: 'shoulder_face_pull', name: 'Face Pull', muscleGroup: 'Hombro', equipment: 'Polea' },

  // BRAZO
  { id: 'arm_bicep_curl_barbell', name: 'Curl de Bíceps con Barra', muscleGroup: 'Bíceps', equipment: 'Barra' },
  { id: 'arm_bicep_curl_dumbbell', name: 'Curl de Bíceps con Mancuernas', muscleGroup: 'Bíceps', equipment: 'Mancuernas' },
  { id: 'arm_hammer_curl', name: 'Curl Martillo', muscleGroup: 'Bíceps', equipment: 'Mancuernas' },
  { id: 'arm_preacher_curl', name: 'Curl Predicador', muscleGroup: 'Bíceps', equipment: 'Barra' },
  { id: 'arm_tricep_pushdown', name: 'Tríceps en Polea Alta', muscleGroup: 'Tríceps', equipment: 'Polea' },
  { id: 'arm_skull_crusher', name: 'Press Francés', muscleGroup: 'Tríceps', equipment: 'Barra' },
  { id: 'arm_dips', name: 'Fondos', muscleGroup: 'Tríceps', equipment: 'Peso Corporal' },
  { id: 'arm_overhead_tricep_ext', name: 'Extensión tras nuca', muscleGroup: 'Tríceps', equipment: 'Mancuernas' },

  // ABDOMEN
  { id: 'abs_crunch', name: 'Crunch Abdominal', muscleGroup: 'Abdomen', equipment: 'Peso Corporal' },
  { id: 'abs_plank', name: 'Plancha', muscleGroup: 'Abdomen', equipment: 'Peso Corporal' },
  { id: 'abs_leg_raise', name: 'Elevación de Piernas', muscleGroup: 'Abdomen', equipment: 'Peso Corporal' },
  { id: 'abs_russian_twist', name: 'Giro Ruso', muscleGroup: 'Abdomen', equipment: 'Peso Corporal' },
];
