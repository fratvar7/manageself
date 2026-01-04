import { initializeApp, getApps, getApp } from 'firebase/app';
// @ts-expect-error: getReactNativePersistence exists in the RN bundle
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { initializeFirestore, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';

// Configuración de Firebase - REEMPLAZAR CON TUS DATOS REALES
const firebaseConfig = {
  apiKey: "AIzaSyDNhsTfLTR26NNLTsMtah6-aT-05jA1uYo",
  authDomain: "managerself.firebaseapp.com",
  projectId: "managerself",
  storageBucket: "managerself.firebasestorage.app",
  messagingSenderId: "246610002098",
  appId: "1:246610002098:web:152acddd8c87e014cd89ab"
};

// Inicializar Firebase solo si no existe
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Inicializar servicios con configuración condicional
let auth: Auth;

// Función asíncrona para inicializar auth con persistencia en RN
async function initializeAuthWithPersistence() {
  if (typeof window === 'undefined') {
    // React Native environment - intentar cargar AsyncStorage
    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');

      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage.default)
      });
      return;
    } catch (error) {
      console.warn('No se pudo cargar AsyncStorage, usando auth sin persistencia:', error);
    }
  }

  // Web o fallback - usar auth estándar
  auth = getAuth(app);
}

// Inicializar auth inmediatamente
initializeAuthWithPersistence();

export { auth };
export const db = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED,
});
export const storage = getStorage(app);

export default app;
