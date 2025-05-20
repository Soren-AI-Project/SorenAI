'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useRouter } from 'next/navigation';
import Layout from '../../components/Layout';
import { useMensajes } from '../../utils/MensajesContext';

interface Mensaje {
  id: string;
  asunto: string;
  contenido: string;
  fecha_envio: string;
  leido: boolean;
  remitente_tipo: string;
  destinatario_tipo: string;
  remitente_nombre?: string;
  destinatario_nombre?: string;
}

export default function MensajesPage() {
  const [loading, setLoading] = useState(true);
  const [mensajesEntrantes, setMensajesEntrantes] = useState<Mensaje[]>([]);
  const [mensajesSalientes, setMensajesSalientes] = useState<Mensaje[]>([]);
  const [activeTab, setActiveTab] = useState<'entrantes' | 'salientes'>('entrantes');
  const router = useRouter();
  const { userProfile } = useMensajes();

  useEffect(() => {
    const cargarDatos = async () => {
      if (!userProfile) return;
      
      await cargarMensajes(userProfile.tipo, userProfile.id);
      setLoading(false);
    };

    if (userProfile) {
      cargarDatos();
    }
  }, [userProfile]);

  const cargarMensajes = async (tipo: string, id: string) => {
    try {
      // Cargar mensajes entrantes
      const { data: entrantes, error: errorEntrantes } = await obtenerMensajesEntrantes(tipo, id);
      
      if (errorEntrantes) {
        console.error("Error al cargar mensajes entrantes:", errorEntrantes);
        return;
      }
      
      setMensajesEntrantes(entrantes || []);
      
      // Cargar mensajes salientes
      const { data: salientes, error: errorSalientes } = await obtenerMensajesSalientes(tipo, id);
      
      if (errorSalientes) {
        console.error("Error al cargar mensajes salientes:", errorSalientes);
        return;
      }
      
      setMensajesSalientes(salientes || []);
      
    } catch (error) {
      console.error("Error al cargar mensajes:", error);
    }
  };

  const obtenerMensajesEntrantes = async (tipo: string, id: string) => {
    // Crear la consulta correcta según el tipo de usuario
    let query;
    
    if (tipo === 'admin') {
      query = supabase
        .from('mensaje')
        .select('*')
        .eq('destinatario_tipo', 'admin')
        .eq('destinatario_admin_id', id)
        .order('fecha_envio', { ascending: false });
    } else if (tipo === 'tecnico') {
      query = supabase
        .from('mensaje')
        .select('*')
        .eq('destinatario_tipo', 'tecnico')
        .eq('destinatario_tecnico_id', id)
        .order('fecha_envio', { ascending: false });
    } else {
      query = supabase
        .from('mensaje')
        .select('*')
        .eq('destinatario_tipo', 'agricultor')
        .eq('destinatario_agricultor_id', id)
        .order('fecha_envio', { ascending: false });
    }
    
    return await query;
  };

  const obtenerMensajesSalientes = async (tipo: string, id: string) => {
    // Crear la consulta correcta según el tipo de usuario
    let query;
    
    if (tipo === 'admin') {
      query = supabase
        .from('mensaje')
        .select('*')
        .eq('remitente_tipo', 'admin')
        .eq('remitente_admin_id', id)
        .order('fecha_envio', { ascending: false });
    } else if (tipo === 'tecnico') {
      query = supabase
        .from('mensaje')
        .select('*')
        .eq('remitente_tipo', 'tecnico')
        .eq('remitente_tecnico_id', id)
        .order('fecha_envio', { ascending: false });
    } else {
      query = supabase
        .from('mensaje')
        .select('*')
        .eq('remitente_tipo', 'agricultor')
        .eq('remitente_agricultor_id', id)
        .order('fecha_envio', { ascending: false });
    }
    
    return await query;
  };

  const formatearFecha = (fechaStr: string) => {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return null; // El Layout ya muestra un estado de carga
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-green-400">Mensajes</h1>
          <button 
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 cursor-pointer flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nuevo Mensaje
          </button>
        </div>
        
        {/* Pestañas */}
        <div className="flex border-b border-gray-700 mb-6">
          <button
            className={`px-4 py-2 font-medium text-sm focus:outline-none ${
              activeTab === 'entrantes'
                ? 'text-green-400 border-b-2 border-green-400 -mb-px'
                : 'text-gray-400 hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('entrantes')}
          >
            Entrantes {mensajesEntrantes.filter(m => !m.leido).length > 0 && `(${mensajesEntrantes.filter(m => !m.leido).length})`}
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm focus:outline-none ${
              activeTab === 'salientes'
                ? 'text-green-400 border-b-2 border-green-400 -mb-px'
                : 'text-gray-400 hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('salientes')}
          >
            Enviados
          </button>
        </div>

        {/* Lista de mensajes */}
        <div className="bg-gray-800 rounded-lg shadow overflow-hidden">
          {activeTab === 'entrantes' && (
            <>
              {mensajesEntrantes.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-gray-400">No tienes mensajes entrantes</div>
                </div>
              ) : (
                <div className="divide-y divide-gray-700">
                  {mensajesEntrantes.map((mensaje) => (
                    <div 
                      key={mensaje.id} 
                      className={`p-4 hover:bg-gray-700 transition-colors cursor-pointer ${
                        !mensaje.leido ? 'bg-gray-700/30' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className={`text-lg ${!mensaje.leido ? 'font-bold text-white' : 'text-gray-300'}`}>
                          {mensaje.asunto}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {formatearFecha(mensaje.fecha_envio)}
                        </span>
                      </div>
                      <div className="text-gray-400 text-sm truncate mb-2">
                        {mensaje.contenido}
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <div>
                          De: <span className="text-gray-400">{mensaje.remitente_nombre || `${mensaje.remitente_tipo}`}</span>
                        </div>
                        {!mensaje.leido && (
                          <div className="bg-green-600/20 text-green-400 px-2 py-0.5 rounded text-xs border border-green-600/20">
                            No leído
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'salientes' && (
            <>
              {mensajesSalientes.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-gray-400">No tienes mensajes enviados</div>
                </div>
              ) : (
                <div className="divide-y divide-gray-700">
                  {mensajesSalientes.map((mensaje) => (
                    <div 
                      key={mensaje.id} 
                      className="p-4 hover:bg-gray-700 transition-colors cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg text-gray-300">
                          {mensaje.asunto}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {formatearFecha(mensaje.fecha_envio)}
                        </span>
                      </div>
                      <div className="text-gray-400 text-sm truncate mb-2">
                        {mensaje.contenido}
                      </div>
                      <div className="text-xs text-gray-500">
                        Para: <span className="text-gray-400">{mensaje.destinatario_nombre || `${mensaje.destinatario_tipo}`}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
} 