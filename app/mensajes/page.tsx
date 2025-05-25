'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { useMensajes } from '../../utils/MensajesContext';
import { ApiClient } from '../../utils/apiClient';
import { formatearFechaMensaje } from '../../utils/shared';

// Deshabilitar el prerenderizado estático para páginas que requieren autenticación
export const dynamic = 'force-dynamic';

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
      
      // Evitar recargar si ya tenemos datos
      if (mensajesEntrantes.length > 0 || mensajesSalientes.length > 0) {
        setLoading(false);
        return;
      }
      
      await cargarMensajes(userProfile.tipo, userProfile.id);
      setLoading(false);
    };

    if (userProfile) {
      cargarDatos();
    }
  }, [userProfile]); // Solo cargar si no tenemos datos

  const cargarMensajes = async (tipo: string, id: string) => {
    try {
      // ✅ SEGURO: Cargar mensajes entrantes desde la API
      const entrantes = await ApiClient.obtenerMensajes(tipo, id, 'entrantes');
      setMensajesEntrantes(entrantes.mensajes || []);
      
      // ✅ SEGURO: Cargar mensajes salientes desde la API
      const salientes = await ApiClient.obtenerMensajes(tipo, id, 'salientes');
      setMensajesSalientes(salientes.mensajes || []);
      
    } catch (error) {
      console.error("Error al cargar mensajes:", error);
    }
  };

  // formatearFecha ahora se importa desde utils/shared como formatearFechaMensaje

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
                        <div className="flex items-center">
                          {!mensaje.leido && (
                            <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                          )}
                          <h3 className="text-white font-medium">{mensaje.asunto}</h3>
                        </div>
                        <span className="text-sm text-gray-400">
                          {formatearFechaMensaje(mensaje.fecha_envio)}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm mb-2">
                        {mensaje.contenido.length > 100 
                          ? `${mensaje.contenido.substring(0, 100)}...` 
                          : mensaje.contenido
                        }
                      </p>
                      <div className="text-xs text-gray-400">
                        De: {mensaje.remitente_tipo} 
                        {mensaje.remitente_nombre && ` - ${mensaje.remitente_nombre}`}
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
                  <div className="text-gray-400">No has enviado mensajes</div>
                </div>
              ) : (
                <div className="divide-y divide-gray-700">
                  {mensajesSalientes.map((mensaje) => (
                    <div 
                      key={mensaje.id} 
                      className="p-4 hover:bg-gray-700 transition-colors cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-white font-medium">{mensaje.asunto}</h3>
                        <span className="text-sm text-gray-400">
                          {formatearFechaMensaje(mensaje.fecha_envio)}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm mb-2">
                        {mensaje.contenido.length > 100 
                          ? `${mensaje.contenido.substring(0, 100)}...` 
                          : mensaje.contenido
                        }
                      </p>
                      <div className="text-xs text-gray-400">
                        Para: {mensaje.destinatario_tipo}
                        {mensaje.destinatario_nombre && ` - ${mensaje.destinatario_nombre}`}
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