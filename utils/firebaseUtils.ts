import { Timestamp } from 'firebase/firestore';

/**
 * Filtra valores undefined de un objeto o array para que sea compatible con Firestore.
 * Firestore no permite valores undefined, pero sí null.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sanitizeData = (data: any): any => {
  if (data === undefined) return null;
  if (data === null) return null;

  // Preservar objetos especiales de Firebase/JS
  if (data instanceof Timestamp) return data;
  if (data instanceof Date) return data;

  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }

  if (typeof data === 'object') {
    const sanitized: any = {};
    // Usar un bucle manual para asegurar que procesamos todas las propiedades enumerables
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const value = data[key];
        // En lugar de omitir, convertimos a null para asegurar compatibilidad total con Firestore
        sanitized[key] = sanitizeData(value);
      }
    }
    return sanitized;
  }

  return data;
};
