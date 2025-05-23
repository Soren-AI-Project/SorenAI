import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { searchParams } = new URL(request.url);
    const tecnicoId = searchParams.get('tecnicoId');

    if (!tecnicoId) {
      return NextResponse.json({ error: 'Parámetro requerido: tecnicoId' }, { status: 400 });
    }

    // Obtener agricultores asignados al técnico
    const { data: agricultores, error } = await supabase
      .from('agricultor')
      .select('id, nombre')
      .eq('id_tecnico', tecnicoId);

    if (error) {
      console.error('Error obteniendo agricultores:', error);
      return NextResponse.json({ error: 'Error obteniendo agricultores' }, { status: 500 });
    }

    return NextResponse.json({ agricultores: agricultores || [] });

  } catch (error) {
    console.error('Error en GET /api/agricultores:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 