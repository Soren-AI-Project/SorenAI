'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '../../components/Layout';
import SimpleLoading from '../../components/SimpleLoading';
import { useMensajes } from '../../utils/MensajesContext';
import { ApiClient } from '../../utils/apiClient';

// Deshabilitar el prerenderizado estático para páginas que requieren autenticación
export const dynamic = 'force-dynamic';

export default function Dashboard() {
  const { mensajesNoLeidos, userProfile } = useMensajes();
  const [loading, setLoading] = useState(true);
  const [parcelasActivas, setParcelasActivas] = useState(0);
  const [ultimoAnalisis, setUltimoAnalisis] = useState("No hay datos");
  
  const isAdmin = userProfile?.tipo === 'admin';
  
  useEffect(() => {
    const cargarDatos = async () => {
      if (!userProfile) {
        setLoading(false);
        return;
      }
      

      
      try {
        // ✅ SEGURO: Usar la nueva API que ejecuta en el servidor
        const data = await ApiClient.obtenerDatosDashboard(userProfile.tipo, userProfile.id);
        setParcelasActivas(data.parcelasActivas);
        setUltimoAnalisis(data.ultimoAnalisis);
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setLoading(false);
      }
    };
    
    cargarDatos();
  }, [userProfile]); // Solo cargar si no tenemos datos



  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Header de bienvenida */}
        <div className="bg-gray-800 rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">¡Hola!</h2>
            </div>
          </div>
        </div>

        {/* Estadísticas principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-400 truncate">
                    Parcelas Activas
                  </dt>
                  <dd className="text-lg font-medium text-white">
                    {parcelasActivas}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.32 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-400 truncate">
                    Mensajes sin leer
                  </dt>
                  <dd className="text-lg font-medium text-white">
                    {mensajesNoLeidos}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5M12 12.75h.007v.008H12V12.75z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-400 truncate">
                    Último análisis
                  </dt>
                  <dd className="text-lg font-medium text-white">
                    {ultimoAnalisis}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Accesos rápidos */}
        <div className={`grid grid-cols-1 md:grid-cols-2 ${isAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6`}>
          <Link href="/parcelas" className="group relative bg-gray-800 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-green-500 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-700 hover:border-green-500 cursor-pointer">
            <div>
              <span className="rounded-lg inline-flex p-3 bg-green-600 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </span>
            </div>
            <div className="mt-8">
              <h3 className="text-lg font-medium text-white">
                <span className="absolute inset-0" aria-hidden="true" />
                Gestionar Parcelas
              </h3>
              <p className="mt-2 text-sm text-gray-400">
                Ver y administrar todas las parcelas asignadas
              </p>
            </div>
            <span className="pointer-events-none absolute top-6 right-6 text-gray-500 group-hover:text-green-400" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
              </svg>
            </span>
          </Link>

          <Link href="/mensajes" className="group relative bg-gray-800 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-700 hover:border-blue-500 cursor-pointer">
            <div>
              <span className="rounded-lg inline-flex p-3 bg-blue-600 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.32 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </span>
            </div>
            <div className="mt-8">
              <h3 className="text-lg font-medium text-white">
                <span className="absolute inset-0" aria-hidden="true" />
                Mensajes
              </h3>
              <p className="mt-2 text-sm text-gray-400">
                Comunicarse con tu equipo
              </p>
            </div>
            <span className="pointer-events-none absolute top-6 right-6 text-gray-500 group-hover:text-blue-400" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
              </svg>
            </span>
          </Link>

          {isAdmin && (
            <Link href="/tecnicos" className="group relative bg-gray-800 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-purple-500 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-700 hover:border-purple-500 cursor-pointer">
              <div>
                <span className="rounded-lg inline-flex p-3 bg-purple-600 text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium text-white">
                  <span className="absolute inset-0" aria-hidden="true" />
                  Técnicos
                </h3>
                <p className="mt-2 text-sm text-gray-400">
                  Gestionar técnicos y asignaciones
                </p>
              </div>
              <span className="pointer-events-none absolute top-6 right-6 text-gray-500 group-hover:text-purple-400" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                </svg>
              </span>
            </Link>
          )}

          <Link href="/analisis" className="group relative bg-gray-800 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-orange-500 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-700 hover:border-orange-500 cursor-pointer">
            <div>
              <span className="rounded-lg inline-flex p-3 bg-orange-600 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
              </span>
            </div>
            <div className="mt-8">
              <h3 className="text-lg font-medium text-white">
                <span className="absolute inset-0" aria-hidden="true" />
                Analíticas
              </h3>
              <p className="mt-2 text-sm text-gray-400">
                Generar informes y análisis
              </p>
            </div>
            <span className="pointer-events-none absolute top-6 right-6 text-gray-500 group-hover:text-orange-400" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
              </svg>
            </span>
          </Link>
        </div>

        {/* Loading */}
        {loading && <SimpleLoading message="Cargando dashboard..." />}
      </div>
    </Layout>
  );
} 