'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { useMensajes } from '../../utils/MensajesContext';
import { supabase } from '../../utils/supabaseClient';

export default function Dashboard() {
  const { mensajesNoLeidos, userProfile } = useMensajes();
  const [loading, setLoading] = useState(true);
  const [parcelasActivas, setParcelasActivas] = useState(0);
  const [ultimoAnalisis, setUltimoAnalisis] = useState("No hay datos");
  
  useEffect(() => {
    const cargarDatos = async () => {
      if (!userProfile) {
        setLoading(false);
        return;
      }
      
      try {
        // Obtener parcelas activas según el tipo de usuario
        if (userProfile.tipo === 'tecnico') {
          // Obtener los agricultores asignados al técnico
          const { data: agricultores } = await supabase
            .from('agricultor')
            .select('id')
            .eq('id_tecnico', userProfile.id);

          if (agricultores && agricultores.length > 0) {
            const agricultorIds = agricultores.map(a => a.id);
            
            // Contar parcelas activas de estos agricultores
            const { count } = await supabase
              .from('parcela')
              .select('*', { count: 'exact', head: true })
              .in('id_agricultor', agricultorIds)
              .eq('estado', true);
              
            setParcelasActivas(count || 0);
            
            // Obtener el último análisis de cualquiera de estas parcelas
            const { data: parcelas } = await supabase
              .from('parcela')
              .select('id')
              .in('id_agricultor', agricultorIds)
              .eq('estado', true);
              
            if (parcelas && parcelas.length > 0) {
              const parcelaIds = parcelas.map(p => p.id);
              
              const { data: analisis } = await supabase
                .from('analitica')
                .select('fecha')
                .in('id_parcela', parcelaIds)
                .order('fecha', { ascending: false })
                .limit(1);
                
              if (analisis && analisis.length > 0) {
                const fecha = new Date(analisis[0].fecha);
                const ahora = new Date();
                const diferenciaDias = Math.floor((ahora.getTime() - fecha.getTime()) / (1000 * 3600 * 24));
                
                if (diferenciaDias === 0) {
                  setUltimoAnalisis("Hoy");
                } else if (diferenciaDias === 1) {
                  setUltimoAnalisis("Hace 1 día");
                } else {
                  setUltimoAnalisis(`Hace ${diferenciaDias} días`);
                }
              }
            }
          }
        } else if (userProfile.tipo === 'admin') {
          // Para administradores, obtener todas las parcelas bajo sus técnicos
          const { data: tecnicos } = await supabase
            .from('tecnico')
            .select('id')
            .eq('id_admin', userProfile.id);
            
          if (tecnicos && tecnicos.length > 0) {
            const tecnicoIds = tecnicos.map(t => t.id);
            
            // Obtener agricultores de estos técnicos
            const { data: agricultores } = await supabase
              .from('agricultor')
              .select('id')
              .in('id_tecnico', tecnicoIds);
              
            if (agricultores && agricultores.length > 0) {
              const agricultorIds = agricultores.map(a => a.id);
              
              // Contar parcelas activas
              const { count } = await supabase
                .from('parcela')
                .select('*', { count: 'exact', head: true })
                .in('id_agricultor', agricultorIds)
                .eq('estado', true);
                
              setParcelasActivas(count || 0);
              
              // Obtener último análisis
              const { data: ultimoAnalisisData } = await supabase
                .from('analitica')
                .select('fecha')
                .order('fecha', { ascending: false })
                .limit(1);
                
              if (ultimoAnalisisData && ultimoAnalisisData.length > 0) {
                const fecha = new Date(ultimoAnalisisData[0].fecha);
                const ahora = new Date();
                const diferenciaDias = Math.floor((ahora.getTime() - fecha.getTime()) / (1000 * 3600 * 24));
                
                if (diferenciaDias === 0) {
                  setUltimoAnalisis("Hoy");
                } else if (diferenciaDias === 1) {
                  setUltimoAnalisis("Hace 1 día");
                } else {
                  setUltimoAnalisis(`Hace ${diferenciaDias} días`);
                }
              }
            }
          }
        } else if (userProfile.tipo === 'agricultor') {
          // Para agricultores, contar sus parcelas activas
          const { count } = await supabase
            .from('parcela')
            .select('*', { count: 'exact', head: true })
            .eq('id_agricultor', userProfile.id)
            .eq('estado', true);
            
          setParcelasActivas(count || 0);
          
          // Obtener el último análisis de sus parcelas
          const { data: parcelas } = await supabase
            .from('parcela')
            .select('id')
            .eq('id_agricultor', userProfile.id)
            .eq('estado', true);
            
          if (parcelas && parcelas.length > 0) {
            const parcelaIds = parcelas.map(p => p.id);
            
            const { data: ultimoAnalisisData } = await supabase
              .from('analitica')
              .select('fecha')
              .in('id_parcela', parcelaIds)
              .order('fecha', { ascending: false })
              .limit(1);
              
            if (ultimoAnalisisData && ultimoAnalisisData.length > 0) {
              const fecha = new Date(ultimoAnalisisData[0].fecha);
              const ahora = new Date();
              const diferenciaDias = Math.floor((ahora.getTime() - fecha.getTime()) / (1000 * 3600 * 24));
              
              if (diferenciaDias === 0) {
                setUltimoAnalisis("Hoy");
              } else if (diferenciaDias === 1) {
                setUltimoAnalisis("Hace 1 día");
              } else {
                setUltimoAnalisis(`Hace ${diferenciaDias} días`);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setLoading(false);
      }
    };
    
    cargarDatos();
  }, [userProfile]);

  if (loading) {
    return null; // El Layout ya muestra un estado de carga
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="bg-gray-800 rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">¡Hola!</h2>
            </div>
            <button 
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 cursor-pointer flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
              </svg>
              Analizar cultivos
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-green-900/30 flex items-center justify-center mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-green-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">Parcelas</h3>
              </div>
              <Link 
                href="/parcelas" 
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 cursor-pointer flex items-center"
              >
                Ver todas →
              </Link>
            </div>
            <p className="text-gray-400 mb-4">Gestiona tus parcelas y consulta el historial de análisis de tus cultivos.</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-400">Parcelas activas</div>
                <div className="text-2xl font-bold text-white">{parcelasActivas}</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-400">Último análisis</div>
                <div className="text-sm text-white">{ultimoAnalisis}</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-green-900/30 flex items-center justify-center mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-green-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">Mensajes</h3>
              </div>
              <Link 
                href="/mensajes" 
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 cursor-pointer flex items-center"
              >
                Ver todas →
              </Link>
            </div>
            <p className="text-gray-400 mb-4">Consulta tus notificaciones y mensajes</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-400">No leídos</div>
                <div className="text-2xl font-bold text-white">{mensajesNoLeidos}</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-400">Último mensaje</div>
                <div className="text-sm text-white">Hace 3 horas</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 