'use client';

import { useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Deshabilitar el prerenderizado estático para páginas que usan autenticación
export const dynamic = 'force-dynamic';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setMessage('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      
      if (error) {
        setError(error.message);
      } else {
        setMessage('Se ha enviado un enlace de recuperación a tu correo electrónico');
      }
    } catch (err) {
      setError('Ha ocurrido un error al procesar tu solicitud');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-gray-800 p-10 rounded-xl shadow-2xl border border-green-800/20">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-green-400 mb-2">Soren<span className="text-gray-400">AI</span></h1>
          <h2 className="text-xl font-bold text-white mt-6 mb-2">Recuperar contraseña</h2>
          <p className="text-gray-400 text-sm">Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
          <div>
            <label htmlFor="email-address" className="sr-only">Correo electrónico</label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="appearance-none relative block w-full px-3 py-3 border border-gray-600 placeholder-gray-500 text-white rounded-md bg-gray-700 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
              placeholder="Correo electrónico"
            />
          </div>

          {error && (
            <div className="bg-red-900/40 border border-red-800 text-red-300 px-4 py-3 rounded relative text-sm" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {message && (
            <div className="bg-green-900/40 border border-green-800 text-green-300 px-4 py-3 rounded relative text-sm" role="alert">
              <span className="block sm:inline">{message}</span>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <Link href="/login" className="text-sm font-medium text-green-400 hover:text-green-300 cursor-pointer">
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
} 