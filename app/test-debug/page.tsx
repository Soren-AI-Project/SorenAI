"use client";

import { useState } from 'react';
import Layout from '../../components/Layout';

interface DiagnosticResult {
  bucketExists: boolean;
  bucketPublic: boolean;
  canList: boolean;
  canUpload: boolean;
  canCreateSignedUrl: boolean;
  sampleFiles: string[];
  errors: string[];
}

export default function TestDebugPage() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/test-bucket');
      const data = await response.json();
      
      if (data.success) {
        setDiagnostics(data.diagnostics);
        setRecommendations(data.recommendations);
      } else {
        setError(data.error || 'Error desconocido');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const createBucket = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/test-bucket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'create-bucket' })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Bucket creado exitosamente
        await runDiagnostics();
      } else {
        setError(data.error || 'Error creando bucket');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const fixFilenames = async () => {
    // Confirmación de limpieza de archivos

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/test-bucket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'fix-filenames' })
      });
      
      const data = await response.json();
      
      if (data.success) {
        const { results } = data;
        // Limpieza completada
        if (results.errors.length > 0) {
          console.error('Errores durante la limpieza:', results.errors);
        }
        await runDiagnostics();
      } else {
        setError(data.error || 'Error limpiando nombres');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: boolean) => {
    return status ? '✅' : '❌';
  };

  const getStatusColor = (status: boolean) => {
    return status ? 'text-green-400' : 'text-red-400';
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h1 className="text-2xl font-bold text-white mb-4">
            Diagnóstico del Bucket de Supabase
          </h1>
          <p className="text-gray-300 mb-6">
            Esta herramienta te ayuda a diagnosticar problemas con el storage de imágenes.
          </p>
          
          <div className="flex gap-4">
            <button
              onClick={runDiagnostics}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Ejecutando...' : 'Ejecutar Diagnóstico'}
            </button>
            
            {diagnostics && !diagnostics.bucketExists && (
              <button
                onClick={createBucket}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Crear Bucket
              </button>
            )}
            
            {diagnostics && diagnostics.bucketExists && (
              <button
                onClick={fixFilenames}
                disabled={loading}
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                🔧 Limpiar Nombres de Archivos
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
            <h3 className="text-red-400 font-semibold mb-2">Error</h3>
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {diagnostics && (
          <div className="space-y-6">
            {/* Resultados del diagnóstico */}
            <div className="bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Resultados del Diagnóstico
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Bucket existe:</span>
                    <span className={`font-semibold ${getStatusColor(diagnostics.bucketExists)}`}>
                      {getStatusIcon(diagnostics.bucketExists)} {diagnostics.bucketExists ? 'Sí' : 'No'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Bucket público:</span>
                    <span className={`font-semibold ${getStatusColor(diagnostics.bucketPublic)}`}>
                      {getStatusIcon(diagnostics.bucketPublic)} {diagnostics.bucketPublic ? 'Sí' : 'No'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Puede listar archivos:</span>
                    <span className={`font-semibold ${getStatusColor(diagnostics.canList)}`}>
                      {getStatusIcon(diagnostics.canList)} {diagnostics.canList ? 'Sí' : 'No'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Puede subir archivos:</span>
                    <span className={`font-semibold ${getStatusColor(diagnostics.canUpload)}`}>
                      {getStatusIcon(diagnostics.canUpload)} {diagnostics.canUpload ? 'Sí' : 'No'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">URLs firmadas:</span>
                    <span className={`font-semibold ${getStatusColor(diagnostics.canCreateSignedUrl)}`}>
                      {getStatusIcon(diagnostics.canCreateSignedUrl)} {diagnostics.canCreateSignedUrl ? 'Sí' : 'No'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Archivos encontrados:</span>
                    <span className="text-white font-semibold">
                      {diagnostics.sampleFiles.length}
                    </span>
                  </div>
                </div>
              </div>

              {diagnostics.sampleFiles.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-gray-300 font-medium mb-2">Archivos de muestra:</h4>
                  <div className="bg-gray-700 rounded p-3">
                    <ul className="text-sm text-gray-300 space-y-1">
                      {diagnostics.sampleFiles.slice(0, 10).map((file, index) => (
                        <li key={index} className="font-mono">• {file}</li>
                      ))}
                      {diagnostics.sampleFiles.length > 10 && (
                        <li className="text-gray-400">... y {diagnostics.sampleFiles.length - 10} más</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Errores */}
            {diagnostics.errors.length > 0 && (
              <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-6">
                <h3 className="text-red-400 font-semibold mb-3">Errores Encontrados</h3>
                <ul className="space-y-2">
                  {diagnostics.errors.map((error, index) => (
                    <li key={index} className="text-red-300 text-sm">
                      • {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recomendaciones */}
            {recommendations.length > 0 && (
              <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-6">
                <h3 className="text-yellow-400 font-semibold mb-3">Recomendaciones</h3>
                <ul className="space-y-2">
                  {recommendations.map((rec, index) => (
                    <li key={index} className="text-yellow-200 text-sm">
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Información adicional */}
            <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-6">
              <h3 className="text-blue-400 font-semibold mb-3">Información Adicional</h3>
              <div className="text-blue-200 text-sm space-y-2">
                <p>• Si el bucket no existe, créalo manualmente en Supabase o usa el botón "Crear Bucket"</p>
                <p>• Si hay errores de permisos, verifica las políticas RLS en Supabase</p>
                <p>• Para URLs públicas, asegúrate de que el bucket esté marcado como público</p>
                <p>• Las URLs firmadas requieren la service role key configurada correctamente</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
} 