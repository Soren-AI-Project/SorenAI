import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configurar el output para evitar problemas con variables de entorno
  output: 'standalone',
  // Configuración de paquetes externos para server components
  serverExternalPackages: ['@supabase/supabase-js'],
};

export default nextConfig;
