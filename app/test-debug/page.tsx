"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../utils/supabaseClient";
import Layout from "../../components/Layout";

export default function TestDebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function runDebug() {
      try {
        // 1. Obtener información del usuario actual
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Session:", session);
        
        if (!session?.user) {
          setDebugInfo({ error: "No hay sesión activa" });
          setLoading(false);
          return;
        }

        const userId = session.user.id;
        const userEmail = session.user.email;

        // 2. Verificar en tabla admin
        const { data: adminData, error: adminError } = await supabase
          .from('admin')
          .select('*')
          .eq('user_id', userId);
        
        // 3. Verificar en tabla tecnico
        const { data: tecnicoData, error: tecnicoError } = await supabase
          .from('tecnico')
          .select('*')
          .eq('user_id', userId);
        
        // 4. Verificar en tabla agricultor
        const { data: agricultorData, error: agricultorError } = await supabase
          .from('agricultor')
          .select('*')
          .eq('user_id', userId);

        // 5. Verificar en tablas de unión
        const { data: usuarioAdminData, error: usuarioAdminError } = await supabase
          .from('usuario_admin')
          .select('*')
          .eq('user_id', userId);

        const { data: usuarioTecnicoData, error: usuarioTecnicoError } = await supabase
          .from('usuario_tecnico')
          .select('*')
          .eq('user_id', userId);

        const { data: usuarioAgricultorData, error: usuarioAgricultorError } = await supabase
          .from('usuario_agricultor')
          .select('*')
          .eq('user_id', userId);

        // 6. Probar función is_user_admin
        const { data: isAdminResult, error: isAdminError } = await supabase
          .rpc('is_user_admin', { user_id_param: userId });

        // 7. Obtener perfil usando endpoint
        const profileResponse = await fetch(`/api/profile?userId=${userId}`);
        const profileData = await profileResponse.json();

        // 8. Probar endpoint de técnicos
        const tecnicosResponse = await fetch('/api/tecnicos', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        const tecnicosData = await tecnicosResponse.json();

        setDebugInfo({
          userId,
          userEmail,
          adminData,
          adminError,
          tecnicoData,
          tecnicoError,
          agricultorData,
          agricultorError,
          usuarioAdminData,
          usuarioAdminError,
          usuarioTecnicoData,
          usuarioTecnicoError,
          usuarioAgricultorData,
          usuarioAgricultorError,
          isAdminResult,
          isAdminError,
          profileData,
          tecnicosResponse: {
            status: tecnicosResponse.status,
            data: tecnicosData
          }
        });

      } catch (error) {
        console.error("Error en debug:", error);
        setDebugInfo({ error: error instanceof Error ? error.message : String(error) });
      } finally {
        setLoading(false);
      }
    }

    runDebug();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="p-8">
          <h1 className="text-2xl font-bold text-green-400 mb-4">Debug de Usuario</h1>
          <p className="text-gray-300">Cargando información de debug...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8">
        <h1 className="text-2xl font-bold text-green-400 mb-4">Debug de Usuario</h1>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-green-400 mb-3">Información de Debug</h2>
          <pre className="text-sm text-gray-300 whitespace-pre-wrap break-words overflow-auto max-h-96">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>

        <div className="mt-6 bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-green-400 mb-3">Análisis</h2>
          {debugInfo && (
            <div className="space-y-2 text-sm">
              <p className="text-gray-300">
                <span className="text-green-400">Usuario ID:</span> {debugInfo.userId}
              </p>
              <p className="text-gray-300">
                <span className="text-green-400">Email:</span> {debugInfo.userEmail}
              </p>
              <p className="text-gray-300">
                <span className="text-green-400">¿Es Admin?:</span> {
                  debugInfo.isAdminResult?.is_admin ? "SÍ" : "NO"
                }
              </p>
              <p className="text-gray-300">
                <span className="text-green-400">Datos en tabla admin:</span> {
                  debugInfo.adminData?.length > 0 ? "SÍ" : "NO"
                }
              </p>
              <p className="text-gray-300">
                <span className="text-green-400">Estado endpoint técnicos:</span> {
                  debugInfo.tecnicosResponse?.status
                }
              </p>
              {debugInfo.tecnicosResponse?.status !== 200 && (
                <p className="text-red-400">
                  <span className="text-green-400">Error técnicos:</span> {
                    JSON.stringify(debugInfo.tecnicosResponse?.data)
                  }
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
} 