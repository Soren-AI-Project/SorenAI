import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userType = searchParams.get('userType');
    const userId = searchParams.get('userId');
    const tipo = searchParams.get('tipo'); // 'entrantes' o 'salientes'

    if (!userType || !userId || !tipo) {
      return NextResponse.json({ error: 'Parámetros requeridos: userType, userId y tipo' }, { status: 400 });
    }

    let query;

    if (tipo === 'entrantes') {
      if (userType === 'admin') {
        query = supabase
          .from('mensaje')
          .select('*')
          .eq('destinatario_tipo', 'admin')
          .eq('destinatario_admin_id', userId)
          .order('fecha_envio', { ascending: false });
      } else if (userType === 'tecnico') {
        query = supabase
          .from('mensaje')
          .select('*')
          .eq('destinatario_tipo', 'tecnico')
          .eq('destinatario_tecnico_id', userId)
          .order('fecha_envio', { ascending: false });
      } else if (userType === 'agricultor') {
        query = supabase
          .from('mensaje')
          .select('*')
          .eq('destinatario_tipo', 'agricultor')
          .eq('destinatario_agricultor_id', userId)
          .order('fecha_envio', { ascending: false });
      } else {
        return NextResponse.json({ error: 'Tipo de usuario no válido' }, { status: 400 });
      }
    } else if (tipo === 'salientes') {
      if (userType === 'admin') {
        query = supabase
          .from('mensaje')
          .select('*')
          .eq('remitente_tipo', 'admin')
          .eq('remitente_admin_id', userId)
          .order('fecha_envio', { ascending: false });
      } else if (userType === 'tecnico') {
        query = supabase
          .from('mensaje')
          .select('*')
          .eq('remitente_tipo', 'tecnico')
          .eq('remitente_tecnico_id', userId)
          .order('fecha_envio', { ascending: false });
      } else if (userType === 'agricultor') {
        query = supabase
          .from('mensaje')
          .select('*')
          .eq('remitente_tipo', 'agricultor')
          .eq('remitente_agricultor_id', userId)
          .order('fecha_envio', { ascending: false });
      } else {
        return NextResponse.json({ error: 'Tipo de usuario no válido' }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: 'Tipo debe ser "entrantes" o "salientes"' }, { status: 400 });
    }

    const { data: mensajes, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ mensajes });
  } catch (error) {
    console.error('Error obteniendo mensajes:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// Para contar mensajes no leídos
export async function POST(request: NextRequest) {
  try {
    const { userType, userId } = await request.json();

    if (!userType || !userId) {
      return NextResponse.json({ error: 'Parámetros requeridos: userType y userId' }, { status: 400 });
    }

    let query;

    if (userType === 'admin') {
      query = supabase
        .from('mensaje')
        .select('*', { count: 'exact', head: true })
        .eq('destinatario_tipo', 'admin')
        .eq('destinatario_admin_id', userId)
        .eq('leido', false);
    } else if (userType === 'tecnico') {
      query = supabase
        .from('mensaje')
        .select('*', { count: 'exact', head: true })
        .eq('destinatario_tipo', 'tecnico')
        .eq('destinatario_tecnico_id', userId)
        .eq('leido', false);
    } else if (userType === 'agricultor') {
      query = supabase
        .from('mensaje')
        .select('*', { count: 'exact', head: true })
        .eq('destinatario_tipo', 'agricultor')
        .eq('destinatario_agricultor_id', userId)
        .eq('leido', false);
    } else {
      return NextResponse.json({ error: 'Tipo de usuario no válido' }, { status: 400 });
    }

    const { count, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ mensajesNoLeidos: count || 0 });
  } catch (error) {
    console.error('Error contando mensajes no leídos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 