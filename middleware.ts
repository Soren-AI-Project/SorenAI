import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware simplificado para pruebas
export async function middleware(req: NextRequest) {
  // Permitir todas las redirecciones para pruebas
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
}; 