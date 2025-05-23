import { createClient } from '@supabase/supabase-js';

// Verificar que las variables de entorno estén definidas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Mostrar advertencias si estamos en desarrollo y faltan variables
if (process.env.NODE_ENV === 'development') {
  if (!supabaseUrl) {
    console.warn('⚠️  NEXT_PUBLIC_SUPABASE_URL no está definida en .env.local');
  }
  if (!supabaseAnonKey) {
    console.warn('⚠️  NEXT_PUBLIC_SUPABASE_ANON_KEY no está definida en .env.local');
  }
}

// Crear el cliente de Supabase con manejo de errores para el build
export const supabase = createClient(
  supabaseUrl!, 
  supabaseAnonKey!,
  {
    auth: {
      // Configurar persistencia para el lado del cliente
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

// Cliente para uso en servidor (sin persistencia)
export const supabaseServer = createClient(
  supabaseUrl!, 
  supabaseAnonKey!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
); 