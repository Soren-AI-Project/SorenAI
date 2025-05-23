import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // Middleware simplificado que solo maneja redirecciones básicas
  // La verificación de autenticación se maneja en el lado del cliente
  
  // Permitir todas las peticiones pasar normalmente
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/parcelas/:path*', 
    '/mensajes/:path*', 
    '/tecnicos/:path*', 
    '/login'
  ],
}; 