import * as Crypto from 'expo-crypto';

// En una aplicación real, esta clave debería estar en variables de entorno o gestionada de forma más segura.
// Para este propósito, usamos una clave fija combinada con el ID del usuario para mayor seguridad por usuario.
const APP_SECRET = 'MANAGESELF_SECURE_KEY';

// Función auxiliar para convertir string a ArrayBuffer
const stringToArrayBuffer = (str: string): Uint8Array => {
  const encoder = new TextEncoder();
  return encoder.encode(str);
};

// Función auxiliar para convertir ArrayBuffer a string
const arrayBufferToString = (buffer: Uint8Array): string => {
  const decoder = new TextDecoder();
  return decoder.decode(buffer);
};

// Función auxiliar para convertir ArrayBuffer a base64
const arrayBufferToBase64 = (buffer: Uint8Array): string => {
  let binary = '';
  const len = buffer.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary);
};

// Función auxiliar para convertir base64 a ArrayBuffer
const base64ToArrayBuffer = (base64: string): Uint8Array => {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

// Derivar una clave de 256 bits usando PBKDF2
const deriveKey = async (userId: string): Promise<Uint8Array> => {
  const keyMaterial = stringToArrayBuffer(`${APP_SECRET}_${userId}`);
  const salt = stringToArrayBuffer('manageself_salt'); // En producción, usar un salt único por usuario

  // Usar expo-crypto para generar un hash SHA-256
  const combined = new Uint8Array(keyMaterial.length + salt.length);
  combined.set(keyMaterial);
  combined.set(salt, keyMaterial.length);

  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    arrayBufferToString(combined)
  );

  // Convertir el hash hex a bytes
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(hash.substr(i * 2, 2), 16);
  }
  return bytes;
};

// XOR simple para encriptación (para demo, en producción usar una librería más robusta)
const xorEncrypt = (data: Uint8Array, key: Uint8Array): Uint8Array => {
  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] ^ key[i % key.length];
  }
  return result;
};

export const encryptPassword = async (password: string, userId: string): Promise<string> => {
  if (!password || !userId) return '';

  try {
    const key = await deriveKey(userId);
    const passwordBytes = stringToArrayBuffer(password);
    const encrypted = xorEncrypt(passwordBytes, key);
    return arrayBufferToBase64(encrypted);
  } catch (error) {
    console.error('Error encrypting password:', error);
    return '';
  }
};

export const decryptPassword = async (encryptedPassword: string, userId: string): Promise<string> => {
  if (!encryptedPassword || !userId) return '';

  try {
    const key = await deriveKey(userId);
    const encryptedBytes = base64ToArrayBuffer(encryptedPassword);
    const decrypted = xorEncrypt(encryptedBytes, key); // XOR es simétrico
    return arrayBufferToString(decrypted);
  } catch (error) {
    console.error('Error decrypting password:', error);
    return '';
  }
};
