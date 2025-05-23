import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔍 === TEST ENV DEBUG ===');
    
    // 1. Obtener todos los usuarios de auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    console.log('📋 Usuarios en auth.users:');
    console.log('- Total usuarios:', authUsers.users?.length || 0);
    authUsers.users?.forEach((user, index) => {
      console.log(`- Usuario ${index + 1}:`, {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      });
    });

    // 2. Obtener todos los admins
    const { data: admins, error: adminError } = await supabase
      .from('admin')
      .select('*');
    
    console.log('🔑 Admins en la tabla admin:');
    console.log('- Total admins:', admins?.length || 0);
    console.log('- Admins:', admins);

    // 3. Obtener todos los técnicos
    const { data: tecnicos, error: tecnicoError } = await supabase
      .from('tecnico')
      .select('*');
    
    console.log('👷 Técnicos en la tabla tecnico:');
    console.log('- Total técnicos:', tecnicos?.length || 0);
    console.log('- Técnicos:', tecnicos);

    // 4. Obtener todas las empresas
    const { data: empresas, error: empresaError } = await supabase
      .from('empresa')
      .select('*');
    
    console.log('🏢 Empresas en la tabla empresa:');
    console.log('- Total empresas:', empresas?.length || 0);
    console.log('- Empresas:', empresas);

    return NextResponse.json({
      success: true,
      debug: {
        authUsers: authUsers.users?.map(u => ({ id: u.id, email: u.email })) || [],
        admins: admins || [],
        tecnicos: tecnicos || [],
        empresas: empresas || [],
        errors: {
          authError,
          adminError,
          tecnicoError,
          empresaError
        }
      }
    });

  } catch (error) {
    console.error('❌ Error en test-env:', error);
    return NextResponse.json(
      { 
        error: 'Error interno', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await request.json();
    const { action, userId, userEmail } = body;

    if (action === 'create_admin') {
      // 1. Primero, crear una empresa si no existe
      let empresaId;
      const { data: existingEmpresa } = await supabase
        .from('empresa')
        .select('id')
        .eq('nombre', 'Empresa Demo')
        .single();

      if (existingEmpresa) {
        empresaId = existingEmpresa.id;
      } else {
        const { data: newEmpresa, error: empresaError } = await supabase
          .from('empresa')
          .insert({
            nombre: 'Empresa Demo',
            cif: 'B12345678'
          })
          .select('id')
          .single();

        if (empresaError) {
          throw new Error('Error creando empresa: ' + empresaError.message);
        }
        empresaId = newEmpresa.id;
      }

      // 2. Crear el admin
      const { data: newAdmin, error: adminError } = await supabase
        .from('admin')
        .insert({
          user_id: userId,
          id_empresa: empresaId,
          nombre: userEmail || 'Admin Usuario',
          nombre_empresa: 'Empresa Demo'
        })
        .select()
        .single();

      if (adminError) {
        throw new Error('Error creando admin: ' + adminError.message);
      }

      console.log('✅ Admin creado exitosamente:', newAdmin);

      return NextResponse.json({
        success: true,
        message: 'Admin creado exitosamente',
        admin: newAdmin
      });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });

  } catch (error) {
    console.error('❌ Error en POST test-env:', error);
    return NextResponse.json(
      { 
        error: 'Error interno', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 