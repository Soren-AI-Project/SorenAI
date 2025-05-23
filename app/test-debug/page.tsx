'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';

export default function TestDebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadDebugInfo();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error obteniendo usuario actual:', error);
    }
  };

  const loadDebugInfo = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-env');
      const data = await response.json();
      setDebugInfo(data);
    } catch (error) {
      console.error('Error cargando debug info:', error);
      setMessage('Error cargando información de debug');
    } finally {
      setLoading(false);
    }
  };

  const createAdmin = async () => {
    if (!currentUser) {
      setMessage('No hay usuario autenticado');
      return;
    }

    setLoading(true);
    setMessage('Creando usuario admin...');

    try {
      const response = await fetch('/api/test-env', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_admin',
          userId: currentUser.id,
          userEmail: currentUser.email
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('✅ Usuario admin creado exitosamente! Recarga la página principal.');
        await loadDebugInfo(); // Recargar la información
      } else {
        setMessage('❌ Error: ' + (data.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error creando admin:', error);
      setMessage('❌ Error creando admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔍 Debug de Usuarios y Perfiles</h1>

        {message && (
          <div className="mb-6 p-4 bg-blue-800 rounded-lg">
            <p>{message}</p>
          </div>
        )}

        {/* Usuario Actual */}
        <div className="mb-8 p-6 bg-gray-800 rounded-lg">
          <h2 className="text-xl font-bold mb-4">👤 Usuario Actual</h2>
          {currentUser ? (
            <div>
              <p><strong>ID:</strong> {currentUser.id}</p>
              <p><strong>Email:</strong> {currentUser.email}</p>
              <p><strong>Creado:</strong> {new Date(currentUser.created_at).toLocaleString()}</p>
            </div>
          ) : (
            <p>No hay usuario autenticado</p>
          )}
        </div>

        {/* Información de Debug */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            <p className="mt-4">Cargando información...</p>
          </div>
        ) : debugInfo ? (
          <div className="space-y-6">
            {/* Usuarios Auth */}
            <div className="p-6 bg-gray-800 rounded-lg">
              <h2 className="text-xl font-bold mb-4">📋 Usuarios en Auth ({debugInfo.debug.authUsers.length})</h2>
              {debugInfo.debug.authUsers.length > 0 ? (
                <div className="space-y-2">
                  {debugInfo.debug.authUsers.map((user: any, index: number) => (
                    <div key={user.id} className="p-3 bg-gray-700 rounded">
                      <p><strong>#{index + 1}:</strong> {user.email} - {user.id}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No hay usuarios en auth</p>
              )}
            </div>

            {/* Admins */}
            <div className="p-6 bg-gray-800 rounded-lg">
              <h2 className="text-xl font-bold mb-4">🔑 Administradores ({debugInfo.debug.admins.length})</h2>
              {debugInfo.debug.admins.length > 0 ? (
                <div className="space-y-2">
                  {debugInfo.debug.admins.map((admin: any, index: number) => (
                    <div key={admin.id} className="p-3 bg-gray-700 rounded">
                      <p><strong>#{index + 1}:</strong> {admin.nombre}</p>
                      <p className="text-sm text-gray-400">User ID: {admin.user_id}</p>
                      <p className="text-sm text-gray-400">Empresa: {admin.nombre_empresa}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <p className="text-gray-400 mb-4">No hay administradores registrados</p>
                  {currentUser && (
                    <button
                      onClick={createAdmin}
                      disabled={loading}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {loading ? 'Creando...' : 'Crear Admin para mi usuario'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Técnicos */}
            <div className="p-6 bg-gray-800 rounded-lg">
              <h2 className="text-xl font-bold mb-4">👷 Técnicos ({debugInfo.debug.tecnicos.length})</h2>
              {debugInfo.debug.tecnicos.length > 0 ? (
                <div className="space-y-2">
                  {debugInfo.debug.tecnicos.map((tecnico: any, index: number) => (
                    <div key={tecnico.id} className="p-3 bg-gray-700 rounded">
                      <p><strong>#{index + 1}:</strong> {tecnico.nombre}</p>
                      <p className="text-sm text-gray-400">User ID: {tecnico.user_id}</p>
                      <p className="text-sm text-gray-400">Admin ID: {tecnico.id_admin}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No hay técnicos registrados</p>
              )}
            </div>

            {/* Empresas */}
            <div className="p-6 bg-gray-800 rounded-lg">
              <h2 className="text-xl font-bold mb-4">🏢 Empresas ({debugInfo.debug.empresas.length})</h2>
              {debugInfo.debug.empresas.length > 0 ? (
                <div className="space-y-2">
                  {debugInfo.debug.empresas.map((empresa: any, index: number) => (
                    <div key={empresa.id} className="p-3 bg-gray-700 rounded">
                      <p><strong>#{index + 1}:</strong> {empresa.nombre}</p>
                      <p className="text-sm text-gray-400">CIF: {empresa.cif}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No hay empresas registradas</p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p>No se pudo cargar la información de debug</p>
            <button
              onClick={loadDebugInfo}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reintentar
            </button>
          </div>
        )}

        <div className="mt-8 p-4 bg-gray-800 rounded-lg">
          <h3 className="text-lg font-bold mb-2">📝 Instrucciones</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Si no apareces como administrador, haz clic en "Crear Admin para mi usuario"</li>
            <li>Una vez creado el admin, ve al dashboard principal</li>
            <li>Deberías ver la pestaña "Técnicos" en el sidebar</li>
            <li>Esta página es solo para debugging - puedes eliminarla después</li>
          </ol>
        </div>
      </div>
    </div>
  );
} 