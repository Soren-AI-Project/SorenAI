import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Verificar variables de entorno
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Variables de entorno faltantes');
      return NextResponse.json(
        { error: 'Configuración del servidor incompleta' },
        { status: 500 }
      );
    }
    
    // Inicializar el cliente de Supabase dentro de la función
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      );
    }

    // 2. Verificar en usuario_tecnico (tabla de unión)
    const { data: usuarioTecnicoData, error: errorTecnico } = await supabase
      .from('usuario_tecnico')
      .select('tecnico_id')
      .eq('user_id', userId)
      .single();

    if (usuarioTecnicoData) {
      return NextResponse.json({
        userProfile: { tipo: 'tecnico', id: usuarioTecnicoData.tecnico_id }
      });
    }

    // 3. Verificar en usuario_agricultor (tabla de unión)
    const { data: usuarioAgricultorData, error: errorAgricultor } = await supabase
      .from('usuario_agricultor')
      .select('agricultor_id')
      .eq('user_id', userId)
      .single();

    if (usuarioAgricultorData) {
      return NextResponse.json({
        userProfile: { tipo: 'agricultor', id: usuarioAgricultorData.agricultor_id }
      });
    }

    // 4. Si no se encuentra en tablas de unión, verificar en tablas principales
    
    // 4a. Verificar directamente en admin
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

    // 4b. Verificar directamente en técnico
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

    // 4c. Verificar directamente en agricultor
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
    console.error('❌ Error en /api/profile:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 