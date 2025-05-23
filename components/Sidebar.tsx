'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMensajes } from '../utils/MensajesContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { mensajesNoLeidos, userProfile } = useMensajes();
  
  // ✅ SEGURO: Determinar si es admin usando el perfil del contexto
  const isAdmin = userProfile?.tipo === 'admin';

  return (
    <aside className="bg-gray-800 w-64 border-r border-gray-700 flex-shrink-0">
      <nav className="mt-6 px-4">
        <div className="space-y-4">
          <Link 
            href="/dashboard" 
            className={`flex items-center px-4 py-3 ${
              pathname === '/dashboard' 
                ? 'bg-gray-700 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            } rounded-md transition-colors group`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 mr-3 ${
              pathname === '/dashboard' ? 'text-white' : 'text-gray-400 group-hover:text-white'
            }`}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            Inicio
          </Link>
          
          <Link 
            href="/parcelas" 
            className={`flex items-center px-4 py-3 ${
              pathname === '/parcelas' || pathname.startsWith('/parcelas/') 
                ? 'bg-gray-700 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            } rounded-md transition-colors group`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 mr-3 ${
              pathname === '/parcelas' || pathname.startsWith('/parcelas/') ? 'text-white' : 'text-gray-400 group-hover:text-white'
            }`}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            Parcelas
          </Link>
          
          <Link 
            href="/mensajes" 
            className={`flex items-center px-4 py-3 ${
              pathname === '/mensajes' 
                ? 'bg-gray-700 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            } rounded-md transition-colors group relative`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 mr-3 ${
              pathname === '/mensajes' ? 'text-white' : 'text-gray-400 group-hover:text-white'
            }`}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            Mensajes
            {mensajesNoLeidos > 0 && (
              <span className="absolute right-4 bg-green-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                {mensajesNoLeidos}
              </span>
            )}
          </Link>

          {isAdmin && (
            <Link 
              href="/tecnicos" 
              className={`flex items-center px-4 py-3 ${
                pathname === '/tecnicos' 
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              } rounded-md transition-colors group`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 mr-3 ${
                pathname === '/tecnicos' ? 'text-white' : 'text-gray-400 group-hover:text-white'
              }`}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m0-4a4 4 0 118 0 4 4 0 01-8 0z" />
              </svg>
              Técnicos
            </Link>
          )}
        </div>
      </nav>
    </aside>
  );
}