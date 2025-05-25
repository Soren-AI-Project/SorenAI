import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const body = await request.json();
    const { parcelaId, ph, conductividad, fotos, userType, userId } = body;

    if (!parcelaId || !userType || !userId) {
      return NextResponse.json({ 
        error: 'Parámetros requeridos: parcelaId, userType, userId' 
      }, { status: 400 });
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
        console.log('Carpeta de análisis creada:', carpetaAnalisis);
        
        // Subir cada foto al bucket en la carpeta del análisis
        let fotosSubidas = 0;
        for (let i = 0; i < fotos.length; i++) {
          const foto = fotos[i];
          if (foto && typeof foto === 'object' && foto.data && foto.name) {
            // Limpiar el nombre del archivo: remover espacios, caracteres especiales y normalizar
            const cleanName = foto.name
              .replace(/\s+/g, '_')  // Reemplazar espacios con guiones bajos
              .replace(/[^a-zA-Z0-9._-]/g, '')  // Remover caracteres especiales
              .toLowerCase();  // Convertir a minúsculas
            
            const fileName = `${carpetaAnalisis}/foto_${i + 1}_${cleanName}`;
            console.log('Nombre original:', foto.name);
            console.log('Nombre limpio:', cleanName);
            console.log('Ruta final:', fileName);
            
            // Convertir el array de números a Uint8Array
            const uint8Array = new Uint8Array(foto.data);
            
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('imganalisis')
              .upload(fileName, uint8Array, {
                contentType: foto.type || 'image/jpeg'
              });

            if (uploadError) {
              console.error('Error subiendo foto:', uploadError);
            } else if (uploadData?.path) {
              console.log('Foto subida exitosamente:', uploadData.path);
              fotosSubidas++;
            }
          }
        }
        
        if (fotosSubidas > 0) {
          resultado += `\nFotos adjuntas: ${fotosSubidas}\n`;
          console.log(`Total de fotos subidas: ${fotosSubidas} en carpeta: ${carpetaAnalisis}`);
        } else {
          console.log('No se subieron fotos');
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