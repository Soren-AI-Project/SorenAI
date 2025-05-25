import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { id: analisisId } = await params;
    const { userType, userId } = await request.json();

    if (!analisisId || !userType || !userId) {
      return NextResponse.json({ 
        error: 'Parámetros requeridos: analisisId, userType, userId' 
      }, { status: 400 });
    }

    // Obtener el análisis para verificar permisos
    const { data: analisisData, error: analisisError } = await supabase
      .from('analitica')
      .select(`
        id,
        path_foto,
        parcela:id_parcela (
          id,
          agricultor:id_agricultor (
            id,
            tecnico:id_tecnico (
              id,
              id_admin
            )
          )
        )
      `)
      .eq('id', analisisId)
      .single();

    if (analisisError || !analisisData) {
      return NextResponse.json({ error: 'Análisis no encontrado' }, { status: 404 });
    }

    // Verificar permisos
    const parcela = analisisData.parcela as any;
    const agricultor = Array.isArray(parcela?.agricultor) 
      ? parcela.agricultor[0] 
      : parcela?.agricultor;
    const tecnico = agricultor?.tecnico;

    let hasAccess = false;
    if (userType === 'tecnico') {
      hasAccess = tecnico && tecnico.id === userId;
    } else if (userType === 'admin') {
      hasAccess = tecnico && tecnico.id_admin === userId;
    }

    if (!hasAccess) {
      return NextResponse.json({ 
        error: 'No tienes permisos para eliminar este análisis' 
      }, { status: 403 });
    }

    // Eliminar imágenes del storage si existen
    if (analisisData.path_foto) {
      try {
        const { data: files, error: listError } = await supabase.storage
          .from('imganalisis')
          .list(analisisData.path_foto);

        if (!listError && files && files.length > 0) {
          const filesToDelete = files.map(file => `${analisisData.path_foto}/${file.name}`);
          
          const { error: deleteError } = await supabase.storage
            .from('imganalisis')
            .remove(filesToDelete);

          if (deleteError) {
            console.error('Error eliminando archivos del storage:', deleteError);
          } else {
            // Archivos eliminados del storage
          }
        }
      } catch (error) {
        console.error('Error procesando eliminación de archivos:', error);
      }
    }

    // Eliminar el análisis de la base de datos
    const { error: deleteError } = await supabase
      .from('analitica')
      .delete()
      .eq('id', analisisId);

    if (deleteError) {
      console.error('Error eliminando análisis:', deleteError);
      return NextResponse.json({ 
        error: 'Error al eliminar el análisis' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Análisis eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error en eliminar análisis:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
} 