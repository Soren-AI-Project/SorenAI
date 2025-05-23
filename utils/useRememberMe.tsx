'use client';

import { useEffect } from 'react';
import { supabase } from './supabaseClient';

export function useRememberMe() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Función para manejar el cierre de la aplicación
    const handleBeforeUnload = () => {
      const rememberPreference = localStorage.getItem('supabase.auth.remember');
      
      // Solo cerrar sesión si el usuario NO marcó "Recordarme"
      if (rememberPreference === 'false') {
        // Usar signOut con localOnly para evitar llamadas al servidor durante el unload
        supabase.auth.signOut({ scope: 'local' });
        localStorage.removeItem('supabase.auth.remember');
      }
    };

    // Función para verificar sesiones temporales
    const checkTemporarySession = () => {
      const rememberPreference = localStorage.getItem('supabase.auth.remember');
      
      if (rememberPreference === 'false') {
        const sessionStartTime = localStorage.getItem('supabase.session.startTime');
        
        if (!sessionStartTime) {
          // Establecer tiempo de inicio para sesión temporal
          localStorage.setItem('supabase.session.startTime', Date.now().toString());
        } else {
          // Verificar si han pasado 8 horas para sesiones temporales
          const startTime = parseInt(sessionStartTime);
          const currentTime = Date.now();
          const eightHours = 8 * 60 * 60 * 1000;
          
          if (currentTime - startTime > eightHours) {
            // Cerrar sesión y limpiar datos
            supabase.auth.signOut();
            localStorage.removeItem('supabase.session.startTime');
            localStorage.removeItem('supabase.auth.remember');
          }
        }
      }
    };

    // Configurar listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Verificar sesión temporal al inicializar
    checkTemporarySession();
    
    // Verificar cada 30 minutos si la sesión temporal debe expirar
    const intervalId = setInterval(checkTemporarySession, 30 * 60 * 1000);

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(intervalId);
    };
  }, []);

  // Función para configurar preferencia de recordar
  const setRememberPreference = (remember: boolean) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('supabase.auth.remember', remember ? 'true' : 'false');
      
      if (remember) {
        // Limpiar tiempo de sesión temporal si existe
        localStorage.removeItem('supabase.session.startTime');
      } else {
        // Establecer tiempo de inicio para sesión temporal
        localStorage.setItem('supabase.session.startTime', Date.now().toString());
      }
    }
  };

  // Función para obtener la preferencia actual
  const getRememberPreference = (): boolean => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('supabase.auth.remember') === 'true';
  };

  return {
    setRememberPreference,
    getRememberPreference
  };
} 