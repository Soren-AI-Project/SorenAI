import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET: Obtener análisis existentes
export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { searchParams } = new URL(request.url);
    const userType = searchParams.get('userType');
    const userId = searchParams.get('userId');

    if (!userType || !userId) {
      return NextResponse.json({ 
        error: 'Parámetros requeridos: userType, userId' 
      }, { status: 400 });
    }

    let analiticasQuery;

    if (userType === 'tecnico') {
      // Técnicos solo ven análisis de sus parcelas asignadas
      analiticasQuery = supabase
        .from('analitica')
        .select(`
          id,
          resultado,
          model_response,
          fecha,
          path_foto,
          parcela:id_parcela (
            id,
            cultivo,
            ha,
            agricultor:id_agricultor (
              id,
              nombre,
              tecnico:id_tecnico (
                id,
                nombre
              )
            )
          )
        `)
        .order('fecha', { ascending: false });

      // Filtrar por técnico a través de la relación
      const { data: analisisData, error: analisisError } = await analiticasQuery;
      
      if (analisisError) {
        return NextResponse.json({ error: 'Error obteniendo análisis' }, { status: 500 });
      }

      // Filtrar manualmente los análisis del técnico
      const analisisTecnico = analisisData?.filter(analisis => {
        const parcela = analisis.parcela as any;
        const agricultor = Array.isArray(parcela?.agricultor) 
          ? parcela.agricultor[0] 
          : parcela?.agricultor;
        const tecnico = agricultor?.tecnico;
        
        return tecnico && tecnico.id === userId;
      }) || [];

      return NextResponse.json({
        success: true,
        analisis: analisisTecnico
      });

    } else if (userType === 'admin') {
      // Admins ven análisis de todos sus técnicos
      
      // Primero obtener todos los técnicos del admin
      const { data: tecnicos, error: tecnicosError } = await supabase
        .from('tecnico')
        .select('id')
        .eq('id_admin', userId);

      if (tecnicosError) {
        return NextResponse.json({ error: 'Error obteniendo técnicos' }, { status: 500 });
      }

      if (!tecnicos || tecnicos.length === 0) {
        return NextResponse.json({
          success: true,
          analisis: []
        });
      }

      const tecnicoIds = tecnicos.map(t => t.id);

      // Obtener todos los análisis
      analiticasQuery = supabase
        .from('analitica')
        .select(`
          id,
          resultado,
          model_response,
          fecha,
          path_foto,
          parcela:id_parcela (
            id,
            cultivo,
            ha,
            agricultor:id_agricultor (
              id,
              nombre,
              tecnico:id_tecnico (
                id,
                nombre
              )
            )
          )
        `)
        .order('fecha', { ascending: false });

      const { data: analisisData, error: analisisError } = await analiticasQuery;
      
      if (analisisError) {
        return NextResponse.json({ error: 'Error obteniendo análisis' }, { status: 500 });
      }

      // Filtrar análisis de técnicos del admin
      const analisisAdmin = analisisData?.filter(analisis => {
        const parcela = analisis.parcela as any;
        const agricultor = Array.isArray(parcela?.agricultor) 
          ? parcela.agricultor[0] 
          : parcela?.agricultor;
        const tecnico = agricultor?.tecnico;
        
        return tecnico && tecnicoIds.includes(tecnico.id);
      }) || [];

      return NextResponse.json({
        success: true,
        analisis: analisisAdmin
      });

    } else {
      return NextResponse.json({ 
        error: 'Tipo de usuario no válido' 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error obteniendo análisis:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}

// POST: Crear nuevo análisis
export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Obtener datos del FormData
    const formData = await request.formData();
    const parcelaId = formData.get('parcelaId') as string;
    const ph = formData.get('ph') as string;
    const conductividad = formData.get('conductividad') as string;
    const userType = formData.get('userType') as string;
    const userId = formData.get('userId') as string;

    if (!parcelaId || !userType || !userId) {
      return NextResponse.json({ 
        error: 'Parámetros requeridos: parcelaId, userType, userId' 
      }, { status: 400 });
    }

    // Obtener archivos de fotos del FormData
    const fotos: File[] = [];
    let index = 0;
    while (true) {
      const foto = formData.get(`foto_${index}`) as File;
      if (!foto) break;
      fotos.push(foto);
      index++;
    }

    // Verificar que el usuario tiene acceso a esta parcela
    const { data: parcelaData, error: parcelaError } = await supabase
      .from('parcela')
      .select(`
        id, 
        agricultor:id_agricultor (
          id, 
          id_tecnico,
          tecnico:id_tecnico (
            id,
            nombre
          )
        )
      `)
      .eq('id', parcelaId)
      .single();

    if (parcelaError || !parcelaData) {
      return NextResponse.json({ error: 'Parcela no encontrada' }, { status: 404 });
    }

    // Verificar permisos - solo técnicos pueden crear análisis manuales
    const agricultor = Array.isArray(parcelaData.agricultor) 
      ? parcelaData.agricultor[0] 
      : parcelaData.agricultor;

    let hasAccess = false;
    if (userType === 'tecnico') {
      const tecnico = agricultor?.tecnico as any;
      hasAccess = tecnico && tecnico.id === userId;
    }

    if (!hasAccess) {
      return NextResponse.json({ 
        error: 'Solo los técnicos asignados pueden crear análisis para esta parcela' 
      }, { status: 403 });
    }

    // Crear el resultado del análisis
    let resultado = '';
    if (ph || conductividad) {
      resultado += `ANÁLISIS DE SUELO - ${new Date().toLocaleDateString('es-ES')}\n\n`;
      
      if (ph) {
        resultado += `pH del suelo: ${ph}\n`;
        const phNum = parseFloat(ph);
        if (phNum < 6.0) {
          resultado += '- Suelo ácido. Considerar encalado.\n';
        } else if (phNum > 7.5) {
          resultado += '- Suelo alcalino. Puede requerir acidificación.\n';
        } else {
          resultado += '- pH en rango óptimo.\n';
        }
      }
      
      if (conductividad) {
        resultado += `\nConductividad eléctrica: ${conductividad} µS/cm\n`;
        const condNum = parseFloat(conductividad);
        if (condNum < 800) {
          resultado += '- Baja salinidad. Buenas condiciones.\n';
        } else if (condNum > 2000) {
          resultado += '- Alta salinidad. Puede afectar el crecimiento.\n';
        } else {
          resultado += '- Salinidad moderada.\n';
        }
      }
    }

    // Manejar subida de fotos al bucket de Supabase
    let carpetaAnalisis = '';
    if (fotos && fotos.length > 0) {
      try {
        // Crear nombre único para la carpeta del análisis
        carpetaAnalisis = `parcela_${parcelaId}/analisis_${Date.now()}`;
        // Carpeta de análisis creada
        
        // Subir cada foto al bucket en la carpeta del análisis
        let fotosSubidas = 0;
        for (let i = 0; i < fotos.length; i++) {
          const foto = fotos[i];
          if (foto && foto.size > 0) {
            // Limpiar el nombre del archivo: remover espacios, caracteres especiales y normalizar
            const cleanName = foto.name
              .replace(/\s+/g, '_')  // Reemplazar espacios con guiones bajos
              .replace(/[^a-zA-Z0-9._-]/g, '')  // Remover caracteres especiales
              .toLowerCase();  // Convertir a minúsculas
            
            const fileName = `${carpetaAnalisis}/foto_${i + 1}_${cleanName}`;
            // Procesando archivo de imagen
            
            // Convertir File a ArrayBuffer y luego a Uint8Array
            const arrayBuffer = await foto.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('imganalisis')
              .upload(fileName, uint8Array, {
                contentType: foto.type || 'image/jpeg',
                cacheControl: '3600',
                upsert: false
              });

            if (uploadError) {
              console.error('Error subiendo foto:', uploadError);
              console.error('Detalles del error:', {
                fileName,
                fileSize: foto.size,
                fileType: foto.type,
                error: uploadError
              });
            } else if (uploadData?.path) {
              // Foto subida exitosamente
              fotosSubidas++;
            }
          } else {
            console.warn(`Foto ${i + 1} está vacía o es inválida`);
          }
        }
        
        if (fotosSubidas > 0) {
          resultado += `\nFotos adjuntas: ${fotosSubidas}\n`;
          // Total de fotos subidas: ${fotosSubidas}
        } else {
          // No se subieron fotos
        }
      } catch (error) {
        console.error('Error procesando fotos:', error);
      }
    }

    // Guardar el análisis en la base de datos
    const { data: nuevaAnalitica, error: insertError } = await supabase
      .from('analitica')
      .insert({
        id_parcela: parcelaId,
        resultado: resultado || 'Análisis realizado sin datos específicos',
        fecha: new Date().toISOString(),
        path_foto: carpetaAnalisis || null
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error guardando análisis:', insertError);
      return NextResponse.json({ 
        error: 'Error al guardar el análisis' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Análisis creado exitosamente',
      analitica: nuevaAnalitica
    });

  } catch (error) {
    console.error('Error en crear análisis:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
} 