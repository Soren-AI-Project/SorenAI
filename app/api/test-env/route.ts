import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Obtener todos los usuarios de auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    // 2. Obtener todos los admins
    const { data: admins, error: adminError } = await supabase
      .from('admin')
      .select('*');

    // 3. Obtener todos los técnicos
    const { data: tecnicos, error: tecnicoError } = await supabase
      .from('tecnico')
      .select('*');

    // 4. Obtener todas las empresas
    const { data: empresas, error: empresaError } = await supabase
      .from('empresa')
      .select('*');

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