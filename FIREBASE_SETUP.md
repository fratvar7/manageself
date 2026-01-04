# Configuración de Firebase

## 🚨 IMPORTANTE: Configura tus credenciales reales

Debes reemplazar las credenciales de demostración en `config/firebase.ts` con tus credenciales reales de Firebase.

### Pasos para obtener tus credenciales:

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita Authentication:
   - Ve a "Authentication" → "Sign-in method"
   - Habilita "Email/Password"
4. Habilita Firestore:
   - Ve a "Firestore Database"
   - Crea una nueva base de datos
   - Elige "Start in test mode" para desarrollo
5. Obtén tus credenciales:
   - Ve a "Project settings" → "General"
   - En "Your apps", selecciona "Web"
   - Copia el objeto `firebaseConfig`

### Reemplaza en `config/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "TU_API_KEY_REAL",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROYECTO_ID",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};
```

## 📱 Características implementadas:

### ✅ Autenticación
- Login/Registro con email y contraseña
- Protección de rutas
- Contexto de autenticación global
- Pantalla de loading

### ✅ Firestore Offline
- Persistencia con IndexedDB
- Sincronización automática al volver online
- Soporte multi-pestaña

### ✅ Navegación protegida
- `/auth` - Solo usuarios no autenticados
- `/(tabs)` - Solo usuarios autenticados
- `/account` - Solo usuarios autenticados

### ✅ Flujo de la app
1. Usuario abre la app → Redirigido a `/auth`
2. Login/registro exitoso → Redirigido a `/(tabs)`
3. Acceso a rutas protegidas sin auth → Redirigido a `/auth`
4. Usuario autenticado en `/auth` → Redirigido a `/(tabs)`

## 🔄 Sincronización Offline

La app funciona completamente offline gracias a:
- **Persistencia local**: Datos guardados en IndexedDB
- **Cache inteligente**: Firestore cachea queries y documentos
- **Sincronización automática**: Los cambios se sincronizan cuando hay internet

## 🚀 Para probar

1. Configura tus credenciales reales
2. Ejecuta `npm start`
3. La app te redigirá automáticamente a la pantalla de login
4. Crea una cuenta o inicia sesión
5. Prueba desconectarte de internet - la app seguirá funcionando

## 📝 Siguiente pasos

- Implementar CRUD de gastos/ingresos en Firestore
- Añadir perfiles de usuario
- Implementar sincronización de datos específicos
- Añadir notificaciones push
