import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../config/firebase';
import { CategoriesService } from '../services/categoriesService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);

      // Si es un nuevo usuario, inicializar categorías por defecto
      if (user) {
        // Pequeño delay para dar tiempo a Firebase a actualizar emailVerified
        setTimeout(async () => {
          try {
            await CategoriesService.initializeDefaultCategories(user.uid);
          } catch (error: any) {
            // Solo loguear si no es un error de permisos (que es esperado durante la carga inicial)
            if (!error?.message?.includes('permissions')) {
              console.error('Error initializing categories:', error);
            }
          }
        }, 1000);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
