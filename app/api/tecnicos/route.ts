import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Inicializar Supabase dentro de la función
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    // Cliente de Supabase con permisos completos (solo en servidor)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Obtener parámetros de la URL
    const { searchParams } = new URL(request.url);
    const userType = searchParams.get('userType');
    const userId = searchParams.get('userId');

    if (!userType || !userId) {
      return NextResponse.json({ error: 'Parámetros requeridos faltantes' }, { status: 400 });
    }

    // Verificar que el usuario sea admin
    if (userType !== 'admin') {
      return NextResponse.json({ error: 'Acceso denegado. Solo admins pueden ver técnicos.' }, { status: 403 });
    }

    // Obtener técnicos del admin
    const { data: tecnicos, error: tecnicosError } = await supabaseAdmin
      .from('tecnico')
      .select('id, nombre, user_id, id_admin')
      .eq('id_admin', userId);

    if (tecnicosError) {
      console.error('Error detallado de Supabase:', JSON.stringify(tecnicosError, null, 2));
      return NextResponse.json({ 
        error: 'Error interno del servidor',
        details: tecnicosError.message,
        debug: true
      }, { status: 500 });
    }

    // Obtener información completa de cada técnico incluyendo email y conteo de parcelas
    const tecnicosCompletos = await Promise.all(
      (tecnicos || []).map(async (tecnico) => {
        // Obtener email del usuario
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(tecnico.user_id);
        
        // Obtener agricultores asignados a este técnico
        const { data: agricultores } = await supabaseAdmin
          .from('agricultor')
          .select('id')
          .eq('id_tecnico', tecnico.id);

        const agricultorIds = agricultores?.map(a => a.id) || [];
        
        // Contar parcelas de estos agricultores
        let totalParcelas = 0;
        if (agricultorIds.length > 0) {
          const { count } = await supabaseAdmin
            .from('parcela')
            .select('*', { count: 'exact', head: true })
            .in('id_agricultor', agricultorIds);
          
          totalParcelas = count || 0;
        }

        return {
          id: tecnico.id,
          nombre: tecnico.nombre,
          email: userData?.user?.email || 'No disponible',
          totalParcelas: totalParcelas,
          agricultoresAsignados: agricultorIds.length
        };
      })
    );

    return NextResponse.json({ tecnicos: tecnicosCompletos });

  } catch (error) {
    console.error('Error general en /api/tecnicos:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido',
      debug: true
    }, { status: 500 });
  }
} 