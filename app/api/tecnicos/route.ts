import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cliente de Supabase para el servidor con privilegios de admin
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Clave de servicio para operaciones admin
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Usar el cliente admin para verificar el token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Error de autenticación:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar que el usuario es admin usando función segura
    const { data: adminCheck, error: adminError } = await supabaseAdmin
      .rpc('is_user_admin', { user_id_param: user.id });

    if (adminError || !adminCheck?.is_admin) {
      console.error('Error verificando admin:', adminError);
      return NextResponse.json({ error: 'Solo los administradores pueden acceder a esta función' }, { status: 403 });
    }

    const adminData = {
      id: adminCheck.admin_id,
      id_empresa: adminCheck.empresa_id
    };

    // Obtener técnicos del admin usando cliente admin para evitar problemas RLS
    const { data: tecnicos, error: tecnicosError } = await supabaseAdmin
      .from('tecnico')
      .select(`
        id,
        nombre,
        user_id
      `)
      .eq('id_admin', adminData.id);

    if (tecnicosError) {
      console.error('Error obteniendo técnicos:', tecnicosError);
      return NextResponse.json({ error: 'Error obteniendo técnicos' }, { status: 500 });
    }

    // Obtener emails de los usuarios y estadísticas
    const tecnicosConDetalles = await Promise.all(
      (tecnicos || []).map(async (tecnico) => {
        // Obtener email del usuario
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(tecnico.user_id);
        
        // Obtener estadísticas del técnico usando cliente admin
        const { data: parcelasData } = await supabaseAdmin
          .from('parcela')
          .select('id, agricultor!inner(id_tecnico)')
          .eq('agricultor.id_tecnico', tecnico.id);

        const { data: agricultoresData } = await supabaseAdmin
          .from('agricultor')
          .select('id')
          .eq('id_tecnico', tecnico.id);

        return {
          id: tecnico.id,
          nombre: tecnico.nombre,
          email: userData?.user?.email || 'N/A',
          totalParcelas: parcelasData?.length || 0,
          agricultoresAsignados: agricultoresData?.length || 0
        };
      })
    );

    return NextResponse.json({
      success: true,
      tecnicos: tecnicosConDetalles
    });

  } catch (error) {
    console.error('Error en GET /api/tecnicos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Usar el cliente admin para verificar el token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Error de autenticación:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar que el usuario es admin usando función segura
    const { data: adminCheck, error: adminError } = await supabaseAdmin
      .rpc('is_user_admin', { user_id_param: user.id });

    if (adminError || !adminCheck?.is_admin) {
      console.error('Error verificando admin:', adminError);
      return NextResponse.json({ error: 'Solo los administradores pueden crear técnicos' }, { status: 403 });
    }

    const adminData = {
      id: adminCheck.admin_id,
      id_empresa: adminCheck.empresa_id
    };

    const body = await request.json();
    const { nombre, email, password } = body;

    // Validar datos requeridos
    if (!nombre || !email || !password) {
      return NextResponse.json({ 
        error: 'Nombre, email y contraseña son requeridos' 
      }, { status: 400 });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        error: 'Formato de email inválido' 
      }, { status: 400 });
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      return NextResponse.json({ 
        error: 'La contraseña debe tener al menos 6 caracteres' 
      }, { status: 400 });
    }

    // Crear usuario en Supabase Auth usando el cliente admin
    const { data: newUser, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Confirmar email automáticamente
    });

    if (userError) {
      console.error('Error creando usuario:', userError);
      if (userError.message.includes('already registered')) {
        return NextResponse.json({ 
          error: 'Ya existe un usuario con este email' 
        }, { status: 400 });
      }
      return NextResponse.json({ 
        error: `Error creando usuario: ${userError.message}` 
      }, { status: 400 });
    }

    if (!newUser.user) {
      return NextResponse.json({ 
        error: 'Error creando usuario' 
      }, { status: 500 });
    }

    // Crear perfil de técnico usando cliente admin para evitar problemas RLS
    const { data: newTecnico, error: tecnicoError } = await supabaseAdmin
      .from('tecnico')
      .insert({
        user_id: newUser.user.id,
        id_admin: adminData.id,
        nombre: nombre
      })
      .select()
      .single();

    if (tecnicoError) {
      console.error('Error creando técnico:', tecnicoError);
      
      // Si falla la creación del perfil, eliminar el usuario creado
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      
      return NextResponse.json({ 
        error: `Error creando perfil de técnico: ${tecnicoError.message}` 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Técnico creado exitosamente',
      tecnico: {
        id: newTecnico.id,
        nombre: newTecnico.nombre,
        email: email,
        totalParcelas: 0,
        agricultoresAsignados: 0
      }
    });

  } catch (error) {
    console.error('Error en POST /api/tecnicos:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
} 