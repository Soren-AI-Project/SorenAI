import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cliente de Supabase con permisos de servicio
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      );
    }

    // Intentar encontrar el usuario en cada tabla en orden de prioridad
    
    // 1. Verificar si es admin
    const { data: adminData, error: adminError } = await supabase
      .from('admin')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (adminData && !adminError) {
      return NextResponse.json({
        userProfile: { tipo: 'admin', id: adminData.id }
      });
    }

    // 2. Verificar si es técnico
    const { data: tecnicoData, error: tecnicoError } = await supabase
      .from('tecnico')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (tecnicoData && !tecnicoError) {
      return NextResponse.json({
        userProfile: { tipo: 'tecnico', id: tecnicoData.id }
      });
    }

    // 3. Verificar si es agricultor
    const { data: agricultorData, error: agricultorError } = await supabase
      .from('agricultor')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (agricultorData && !agricultorError) {
      return NextResponse.json({
        userProfile: { tipo: 'agricultor', id: agricultorData.id }
      });
    }

    // Si no se encuentra en ninguna tabla
    return NextResponse.json(
      { error: 'Perfil de usuario no encontrado' },
      { status: 404 }
    );

  } catch (error) {
    console.error('Error en /api/profile:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 