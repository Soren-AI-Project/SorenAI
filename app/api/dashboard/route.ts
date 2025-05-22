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

    if (!userType || !userId) {
      return NextResponse.json({ error: 'Parámetros requeridos: userType y userId' }, { status: 400 });
    }

    let parcelasActivas = 0;
    let ultimoAnalisis = "No hay datos";

    if (userType === 'tecnico') {
      // Obtener los agricultores asignados al técnico
      const { data: agricultores } = await supabase
        .from('agricultor')
        .select('id')
        .eq('id_tecnico', userId);

      if (agricultores && agricultores.length > 0) {
        const agricultorIds = agricultores.map((a: any) => a.id);
        
        // Contar parcelas activas de estos agricultores
        const { count } = await supabase
          .from('parcela')
          .select('*', { count: 'exact', head: true })
          .in('id_agricultor', agricultorIds)
          .eq('estado', true);
          
        parcelasActivas = count || 0;
        
        // Obtener el último análisis de cualquiera de estas parcelas
        const { data: parcelas } = await supabase
          .from('parcela')
          .select('id')
          .in('id_agricultor', agricultorIds)
          .eq('estado', true);
          
        if (parcelas && parcelas.length > 0) {
          const parcelaIds = parcelas.map((p: any) => p.id);
          
          const { data: analisis } = await supabase
            .from('analitica')
            .select('fecha')
            .in('id_parcela', parcelaIds)
            .order('fecha', { ascending: false })
            .limit(1);
            
          if (analisis && analisis.length > 0) {
            const fecha = new Date(analisis[0].fecha);
            const ahora = new Date();
            const diferenciaDias = Math.floor((ahora.getTime() - fecha.getTime()) / (1000 * 3600 * 24));
            
            if (diferenciaDias === 0) {
              ultimoAnalisis = "Hoy";
            } else if (diferenciaDias === 1) {
              ultimoAnalisis = "Hace 1 día";
            } else {
              ultimoAnalisis = `Hace ${diferenciaDias} días`;
            }
          }
        }
      }
    } else if (userType === 'admin') {
      // Para administradores, obtener todas las parcelas bajo sus técnicos
      const { data: tecnicos } = await supabase
        .from('tecnico')
        .select('id')
        .eq('id_admin', userId);
        
      if (tecnicos && tecnicos.length > 0) {
        const tecnicoIds = tecnicos.map((t: any) => t.id);
        
        // Obtener agricultores de estos técnicos
        const { data: agricultores } = await supabase
          .from('agricultor')
          .select('id')
          .in('id_tecnico', tecnicoIds);
          
        if (agricultores && agricultores.length > 0) {
          const agricultorIds = agricultores.map((a: any) => a.id);
          
          // Contar parcelas activas
          const { count } = await supabase
            .from('parcela')
            .select('*', { count: 'exact', head: true })
            .in('id_agricultor', agricultorIds)
            .eq('estado', true);
            
          parcelasActivas = count || 0;
          
          // Obtener último análisis
          const { data: ultimoAnalisisData } = await supabase
            .from('analitica')
            .select('fecha')
            .order('fecha', { ascending: false })
            .limit(1);
            
          if (ultimoAnalisisData && ultimoAnalisisData.length > 0) {
            const fecha = new Date(ultimoAnalisisData[0].fecha);
            const ahora = new Date();
            const diferenciaDias = Math.floor((ahora.getTime() - fecha.getTime()) / (1000 * 3600 * 24));
            
            if (diferenciaDias === 0) {
              ultimoAnalisis = "Hoy";
            } else if (diferenciaDias === 1) {
              ultimoAnalisis = "Hace 1 día";
            } else {
              ultimoAnalisis = `Hace ${diferenciaDias} días`;
            }
          }
        }
      }
    }

    return NextResponse.json({ parcelasActivas, ultimoAnalisis });
  } catch (error) {
    console.error('Error obteniendo datos del dashboard:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 