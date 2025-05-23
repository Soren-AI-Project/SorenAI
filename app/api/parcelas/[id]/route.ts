import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { searchParams } = new URL(request.url);
    const userType = searchParams.get('userType');
    const userId = searchParams.get('userId');
    const resolvedParams = await params;
    const parcelaId = resolvedParams.id;

    if (!userType || !userId || !parcelaId) {
      return NextResponse.json({ error: 'Parámetros requeridos: userType, userId y id de parcela' }, { status: 400 });
    }

    // Obtener la parcela con su agricultor
    const { data: parcelaData, error: parcelaError } = await supabase
      .from('parcela')
      .select(`
        id, 
        cultivo, 
        ha, 
        estado,
        id_agricultor,
        agricultor:id_agricultor (
          id, 
          nombre
        )
      `)
      .eq('id', parcelaId)
      .single();

    if (parcelaError || !parcelaData) {
      return NextResponse.json({ error: 'Parcela no encontrada' }, { status: 404 });
    }

    // Verificar permisos según el tipo de usuario
    let hasAccess = false;

    if (userType === 'tecnico') {
      // Verificar si el técnico tiene acceso a esta parcela
      const { data: agricultores } = await supabase
        .from('agricultor')
        .select('id')
        .eq('id_tecnico', userId);

      const agricultorIds = agricultores?.map((a: any) => a.id) || [];
      const agricultor = Array.isArray(parcelaData.agricultor) 
        ? parcelaData.agricultor[0] 
        : parcelaData.agricultor;

      hasAccess = agricultor && agricultorIds.includes(agricultor.id);
    } else if (userType === 'admin') {
      // Para admin, verificar a través de sus técnicos
      const { data: tecnicos } = await supabase
        .from('tecnico')
        .select('id')
        .eq('id_admin', userId);

      if (tecnicos && tecnicos.length > 0) {
        const tecnicoIds = tecnicos.map((t: any) => t.id);
        
        const { data: agricultores } = await supabase
          .from('agricultor')
          .select('id')
          .in('id_tecnico', tecnicoIds);

        const agricultorIds = agricultores?.map((a: any) => a.id) || [];
        const agricultor = Array.isArray(parcelaData.agricultor) 
          ? parcelaData.agricultor[0] 
          : parcelaData.agricultor;

        hasAccess = agricultor && agricultorIds.includes(agricultor.id);
      }
    } else if (userType === 'agricultor') {
      // El agricultor solo puede ver sus propias parcelas
      const agricultor = Array.isArray(parcelaData.agricultor) 
        ? parcelaData.agricultor[0] 
        : parcelaData.agricultor;

      hasAccess = agricultor && agricultor.id === userId;
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'No tienes permiso para ver esta parcela' }, { status: 403 });
    }

    // Obtener analíticas de la parcela
    const { data: analiticas } = await supabase
      .from('analitica')
      .select('id, id_parcela, path_foto, resultado, fecha')
      .eq('id_parcela', parcelaId)
      .order('fecha', { ascending: false });

    // Buscar el último análisis
    const { data: ultimoAnalisisData } = await supabase
      .from('analitica')
      .select('fecha')
      .eq('id_parcela', parcelaId)
      .order('fecha', { ascending: false })
      .limit(1);

    let ultimoAnalisis = "No hay análisis";
    if (ultimoAnalisisData && ultimoAnalisisData.length > 0) {
      const fecha = new Date(ultimoAnalisisData[0].fecha);
      ultimoAnalisis = fecha.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      });
    }

    return NextResponse.json({ 
      parcela: {
        ...parcelaData,
        ultimoAnalisis
      },
      analiticas: analiticas || []
    });
  } catch (error) {
    console.error('Error obteniendo detalle de parcela:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 