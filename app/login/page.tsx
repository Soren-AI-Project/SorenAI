'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useRouter } from 'next/navigation';
import { SessionManager } from '../../utils/sessionManager';
import Link from 'next/link';

// Deshabilitar el prerenderizado estático para páginas que usan autenticación
export const dynamic = 'force-dynamic';

// Mapeo de mensajes de error de Supabase al español
const errorMessages: Record<string, string> = {
  'Invalid login credentials': 'Credenciales de acceso inválidas',
  'Email not confirmed': 'Correo electrónico no confirmado',
  'Password recovery required': 'Se requiere recuperación de contraseña',
  'User not found': 'Usuario no encontrado',
  'Invalid email or password': 'Correo o contraseña inválidos',
  'Email link is invalid or has expired': 'El enlace es inválido o ha expirado',
  'Something went wrong': 'Algo salió mal, intente nuevamente',
  'A user with this email address has already been registered': 'Ya existe un usuario con este correo electrónico',
  'Invalid credentials': 'Credenciales inválidas',
  'Invalid email': 'Correo electrónico inválido',
  'User already registered': 'Usuario ya registrado',
  'Server error': 'Error del servidor, intente más tarde'
};

// Traduce mensajes de error basados en el mapeo anterior
function translateError(message: string): string {
  return errorMessages[message] || message;
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const router = useRouter();

  // Verificar si ya existe una sesión activa al cargar la página
  useEffect(() => {
    const checkExistingSession = async () => {
      console.log('🔍 Verificando sesión existente...');
      
      try {
        // Verificar si hay una sesión guardada localmente
        const savedSession = SessionManager.getSavedSessionInfo();
        const rememberPreference = SessionManager.getRememberPreference();
        
        console.log('💾 Sesión guardada:', savedSession);
        console.log('📖 Preferencia remember:', rememberPreference);
        
        // Establecer el estado del checkbox
        setRememberMe(rememberPreference);
        
        // Verificar sesión de Supabase
        const { data: { session } } = await supabase.auth.getSession();
        console.log('🔐 Sesión de Supabase:', !!session);
        
        if (session && session.user) {
          console.log('✅ Sesión activa encontrada, redirigiendo...');
          // Actualizar información de sesión guardada
          SessionManager.saveSessionInfo(session.user.id, session.user.email || '');
          router.push('/dashboard');
          return;
        }
        
        // Si no hay sesión de Supabase pero hay sesión guardada y no está expirada
        if (savedSession && !SessionManager.isSessionExpired()) {
          console.log('🔄 Intentando recuperar sesión desde información guardada...');
          // Aquí podrías intentar validar la sesión con el servidor si fuera necesario
        }
        
        setCheckingSession(false);
      } catch (error) {
        console.error('❌ Error verificando sesión existente:', error);
        setCheckingSession(false);
      }
    };

    checkExistingSession();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('🚀 Iniciando proceso de login...');
    console.log('📧 Email:', email);
    console.log('✅ Remember me:', rememberMe);

    try {
      // Autenticación con Supabase
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password
      });
      
      if (error) {
        console.error('❌ Error de autenticación:', error);
        setError(translateError(error.message));
        setLoading(false);
      } else if (data?.session && data?.user) {
        console.log('✅ Login exitoso');
        console.log('👤 Usuario:', data.user.id, data.user.email);
        
        // Configurar preferencia de recordar ANTES de guardar la sesión
        SessionManager.setRememberPreference(rememberMe);
        
        // Guardar información de sesión
        SessionManager.saveSessionInfo(data.user.id, data.user.email || '');
        
        console.log('➡️ Redirigiendo al dashboard...');
        router.push('/dashboard');
      } else {
        console.error('❌ Login fallido: no hay sesión o usuario');
        setError("No se pudo iniciar sesión. Inténtelo de nuevo.");
        setLoading(false);
      }
    } catch (err) {
      console.error("❌ Error inesperado en login:", err);
      setError("Ocurrió un error inesperado. Por favor, inténtelo de nuevo.");
      setLoading(false);
    }
  };

  // Mostrar estado de carga mientras se verifica la sesión existente
  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-gray-800 p-10 rounded-xl shadow-2xl border border-green-800/20">
          <div className="text-center py-8 flex flex-col items-center justify-center">
            <div className="w-20 h-20 mb-4 flex items-center justify-center relative">
              <div className="absolute inset-0 flex items-center justify-center animate-spin-slow">
                <svg className="w-16 h-16 text-green-400 opacity-60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" strokeDasharray="62.8 62.8" />
                </svg>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-12 h-12">
                  <path d="M30 60 L30 80 L70 80 L70 60 Z" fill="#1e3a3a" />
                  <rect x="28" y="80" width="44" height="5" rx="2" fill="#1a2e2e" />
                  <ellipse cx="50" cy="85" rx="22" ry="3" fill="rgba(0,0,0,0.1)" />
                  <path d="M50 60 L50 45" stroke="#2e9e6b" strokeWidth="2" fill="none" />
                  <path d="M50 45 Q60 40 65 30 Q50 32 50 45" fill="#26ae7b" />
                  <path d="M50 45 Q40 35 30 33 Q45 45 50 45" fill="#26ae7b" />
                  <path d="M50 45 Q40 40 35 30 Q50 32 50 45" fill="#26ae7b" />
                  <path d="M50 50 Q60 48 70 55 Q55 45 50 50" fill="#26ae7b" />
                  <path d="M58 36 Q55 38 55 35" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.5" />
                  <path d="M42 38 Q45 40 45 37" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.5" />
                </svg>
              </div>
            </div>
            <div className="text-lg font-medium text-green-400 mb-2">Verificando sesión...</div>
            <p className="text-gray-300">Por favor espera un momento</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-gray-800 p-10 rounded-xl shadow-2xl border border-green-800/20">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-green-400 mb-2">Soren<span className="text-gray-400">AI</span></h1>
          <p className="text-gray-400 text-sm mb-5">Análisis inteligente de tus cultivos</p>
          <div className="flex justify-center mb-6">
            <div className="relative w-24 h-24 rounded-full bg-green-900/30 flex items-center justify-center">
              <div className="absolute">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-16 h-16">
                  <path d="M30 60 L30 80 L70 80 L70 60 Z" fill="#1e3a3a" />
                  <rect x="28" y="80" width="44" height="5" rx="2" fill="#1a2e2e" />
                  <ellipse cx="50" cy="85" rx="22" ry="3" fill="rgba(0,0,0,0.1)" />
                  
                  <path d="M50 60 L50 45" stroke="#2e9e6b" strokeWidth="2" fill="none" />
                  
                  <path d="M50 45 Q60 40 65 30 Q50 32 50 45" fill="#26ae7b" />
                  <path d="M50 45 Q40 35 30 33 Q45 45 50 45" fill="#26ae7b" />
                  <path d="M50 45 Q40 40 35 30 Q50 32 50 45" fill="#26ae7b" />
                  <path d="M50 50 Q60 48 70 55 Q55 45 50 50" fill="#26ae7b" />
                  
                  <path d="M58 36 Q55 38 55 35" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.5" />
                  <path d="M42 38 Q45 40 45 37" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.5" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md -space-y-px">
            <div className="mb-5">
              <label htmlFor="email-address" className="sr-only">Correo electrónico</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-3 py-3 border border-gray-600 placeholder-gray-500 text-white rounded-md bg-gray-700 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm autofill:bg-gray-700 autofill:text-white"
                placeholder="Correo electrónico"
                style={{ WebkitTextFillColor: 'white', WebkitBoxShadow: '0 0 0px 1000px #374151 inset' }}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Contraseña</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-3 border border-gray-600 placeholder-gray-500 text-white rounded-md bg-gray-700 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm autofill:bg-gray-700 autofill:text-white"
                placeholder="Contraseña"
                style={{ WebkitTextFillColor: 'white', WebkitBoxShadow: '0 0 0px 1000px #374151 inset' }}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-900/40 border border-red-800 text-red-300 px-4 py-3 rounded relative text-sm" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => {
                  console.log('Checkbox clicked:', e.target.checked);
                  setRememberMe(e.target.checked);
                }}
                style={{
                  width: '16px',
                  height: '16px',
                  marginRight: '8px',
                  accentColor: '#10b981'
                }}
              />
              <label htmlFor="remember-me" className="text-sm text-gray-400 cursor-pointer">
                Recuérdame
              </label>
            </div>

            <div className="text-sm">
              <Link href="/reset-password" className="font-medium text-green-400 hover:text-green-300 cursor-pointer">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 cursor-pointer disabled:opacity-70"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <svg className="h-5 w-5 text-green-500 group-hover:text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                </svg>
              </span>
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 