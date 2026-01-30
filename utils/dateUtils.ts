/**
 * Safely converts a value that could be a Firestore Timestamp, a Date object,
 * or a plain object with seconds/nanoseconds to a standard Date object.
 */
export const ensureDate = (value: any): Date => {
  if (!value) return new Date();

  // If it's already a Date object
  if (value instanceof Date) return value;

  // If it's a Firestore Timestamp (has toDate method)
  if (value && typeof value.toDate === 'function') return (value as any).toDate();

  // If it's a serialized Timestamp object { seconds: number, nanoseconds: number }
  if (value && typeof value.seconds === 'number') {
    return new Date(value.seconds * 1000 + (value.nanoseconds || 0) / 1000000);
  }

  // Try to parse string or other numeric values
  const date = new Date(value);
  return isNaN(date.getTime()) ? new Date() : date;
};

export const formatDate = (value: any): string => {
  return ensureDate(value).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const formatDateTime = (value: any): string => {
  return ensureDate(value).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Formats a date as YYYY-MM-DD using local time components.
 * This avoids timezone shifts that happen with toISOString().
 */
export const formatDateISO = (value: any): string => {
  const d = ensureDate(value);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
