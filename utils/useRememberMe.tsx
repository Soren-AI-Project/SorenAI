'use client';

import { useEffect } from 'react';
import { supabase } from './supabaseClient';

export function useRememberMe() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.log('🔧 useRememberMe: Inicializando...');

    // Función para obtener la preferencia actual
    const getRememberPreference = (): boolean => {
      const preference = localStorage.getItem('supabase.auth.remember');
      console.log('📖 Preferencia actual de recordar:', preference);
      return preference === 'true';
    };

    // Función para manejar el cierre de la aplicación
    const handleBeforeUnload = () => {
      const rememberPreference = getRememberPreference();
      console.log('🚪 beforeunload - Recordar:', rememberPreference);
      
      // Solo cerrar sesión si el usuario NO marcó "Recordarme"
      if (!rememberPreference) {
        console.log('🔐 Cerrando sesión (no recordar)');
        supabase.auth.signOut({ scope: 'local' });
        localStorage.removeItem('supabase.auth.remember');
        localStorage.removeItem('supabase.session.startTime');
      }
    };

    // Función para verificar sesiones temporales
    const checkTemporarySession = () => {
      const rememberPreference = getRememberPreference();
      
      if (!rememberPreference) {
        const sessionStartTime = localStorage.getItem('supabase.session.startTime');
        
        if (!sessionStartTime) {
          // Establecer tiempo de inicio para sesión temporal
          const startTime = Date.now().toString();
          localStorage.setItem('supabase.session.startTime', startTime);
          console.log('⏰ Tiempo de sesión temporal establecido:', startTime);
        } else {
          // Verificar si han pasado 8 horas para sesiones temporales
          const startTime = parseInt(sessionStartTime);
          const currentTime = Date.now();
          const eightHours = 8 * 60 * 60 * 1000;
          
          if (currentTime - startTime > eightHours) {
            console.log('⏱️ Sesión temporal expirada (8 horas)');
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
    console.log('💾 Configurando preferencia de recordar:', remember);
    if (typeof window !== 'undefined') {
      localStorage.setItem('supabase.auth.remember', remember ? 'true' : 'false');
      
      if (remember) {
        // Limpiar tiempo de sesión temporal si existe
        localStorage.removeItem('supabase.session.startTime');
        console.log('🗑️ Tiempo de sesión temporal eliminado (recordar activo)');
      } else {
        // Establecer tiempo de inicio para sesión temporal
        const startTime = Date.now().toString();
        localStorage.setItem('supabase.session.startTime', startTime);
        console.log('⏰ Tiempo de sesión temporal establecido:', startTime);
      }
    }
  };

  // Función para obtener la preferencia actual
  const getRememberPreference = (): boolean => {
    if (typeof window === 'undefined') return false;
    const preference = localStorage.getItem('supabase.auth.remember') === 'true';
    console.log('📖 Obteniendo preferencia de recordar:', preference);
    return preference;
  };

  return {
    setRememberPreference,
    getRememberPreference
  };
} 