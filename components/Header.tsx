'use client';

import { supabase } from '../utils/supabaseClient';
import { useRouter } from 'next/navigation';

export default function Header() {
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="bg-gray-800 shadow-md z-10">
      <div className="w-full px-4 py-4 flex justify-between items-center">
        <div className="flex items-center cursor-pointer" onClick={() => router.push('/dashboard')}>
          <div className="w-14 h-14 mr-4 bg-green-900/30 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-8 h-8">
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
          <h1 className="text-2xl font-bold text-green-400">Soren<span className="text-gray-400">AI</span></h1>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 cursor-pointer"
          >
            Área Cliente
          </button>
          <button 
            onClick={handleSignOut}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 cursor-pointer"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  );
}