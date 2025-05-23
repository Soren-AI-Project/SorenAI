import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface Agricultor {
  id: string;
  nombre?: string;
}

interface Tecnico {
  id: string;
}

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Clave del servidor, no pública
    
    // Inicializar el cliente dentro de la función
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { searchParams } = new URL(request.url);
    const userType = searchParams.get('userType');
    const userId = searchParams.get('userId');

    if (!userType || !userId) {
      return NextResponse.json({ error: 'Parámetros requeridos: userType y userId' }, { status: 400 });
    }

    let parcelas;

    if (userType === 'tecnico') {
      // Obtener parcelas del técnico
      const { data: agricultores } = await supabase
        .from('agricultor')
        .select('id')
        .eq('id_tecnico', userId);

      if (agricultores && agricultores.length > 0) {
        const agricultorIds = agricultores.map((a: Agricultor) => a.id);
        
        const { data, error } = await supabase
          .from('parcela')
          .select(`
            *,
            agricultor:id_agricultor (
              id,
              nombre
            )
          `)
          .in('id_agricultor', agricultorIds)
          .eq('estado', true);

        if (error) throw error;
        parcelas = data;
      } else {
        parcelas = [];
      }
    } else if (userType === 'admin') {
      // Obtener parcelas del admin a través de sus técnicos
      const { data: tecnicos } = await supabase
        .from('tecnico')
        .select('id')
        .eq('id_admin', userId);

      if (tecnicos && tecnicos.length > 0) {
        const tecnicoIds = tecnicos.map((t: Tecnico) => t.id);
        
        const { data: agricultores } = await supabase
          .from('agricultor')
          .select('id')
          .in('id_tecnico', tecnicoIds);

        if (agricultores && agricultores.length > 0) {
          const agricultorIds = agricultores.map((a: Agricultor) => a.id);
          
          const { data, error } = await supabase
            .from('parcela')
            .select(`
              *,
              agricultor:id_agricultor (
                id,
                nombre
              )
            `)
            .in('id_agricultor', agricultorIds)
            .eq('estado', true);

          if (error) throw error;
          parcelas = data;
        } else {
          parcelas = [];
        }
      } else {
        parcelas = [];
      }
    } else {
      return NextResponse.json({ error: 'Tipo de usuario no válido' }, { status: 400 });
    }

    return NextResponse.json({ parcelas });
  } catch (error) {
    console.error('Error obteniendo parcelas:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const body = await request.json();
    const { cultivo, hectareas, agricultorId, tecnicoId } = body;

    // Validar datos requeridos
    if (!cultivo || !hectareas || !agricultorId || !tecnicoId) {
      return NextResponse.json({ 
        error: 'Todos los campos son requeridos: cultivo, hectareas, agricultorId, tecnicoId' 
      }, { status: 400 });
    }

    // Validar que el agricultor pertenece al técnico
    const { data: agricultor, error: agricultorError } = await supabase
      .from('agricultor')
      .select('id, nombre')
      .eq('id', agricultorId)
      .eq('id_tecnico', tecnicoId)
      .single();

    if (agricultorError || !agricultor) {
      return NextResponse.json({ 
        error: 'El agricultor no está asignado a este técnico' 
      }, { status: 403 });
    }

    // Crear la parcela
    const { data: nuevaParcela, error: parcelaError } = await supabase
      .from('parcela')
      .insert({
        cultivo,
        ha: parseFloat(hectareas),
        id_agricultor: agricultorId,
        estado: true
      })
      .select(`
        *,
        agricultor:id_agricultor (
          id,
          nombre
        )
      `)
      .single();

    if (parcelaError) {
      console.error('Error creando parcela:', parcelaError);
      return NextResponse.json({ 
        error: 'Error al crear la parcela' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Parcela creada exitosamente',
      parcela: nuevaParcela
    });

  } catch (error) {
    console.error('Error en POST /api/parcelas:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
} 