import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Inicializar OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const body = await request.json();
    const { parcelaId, userType, userId } = body;

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
        cultivo, 
        ha,
        agricultor:id_agricultor (
          id, 
          nombre,
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

    // Verificar permisos
    let hasAccess = false;
    const agricultor = Array.isArray(parcelaData.agricultor) 
      ? parcelaData.agricultor[0] 
      : parcelaData.agricultor;

    if (userType === 'tecnico') {
      const tecnico = agricultor?.tecnico;
      hasAccess = tecnico && tecnico[0]?.id === userId;
    } else if (userType === 'admin') {
      // Para admin, verificar a través de sus técnicos
      const { data: tecnicos } = await supabase
        .from('tecnico')
        .select('id')
        .eq('id_admin', userId);

      const tecnicoIds = tecnicos?.map((t: any) => t.id) || [];
      const tecnico = agricultor?.tecnico;
      hasAccess = tecnico && tecnicoIds.includes(tecnico[0]?.id);
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'No tienes permiso para analizar esta parcela' }, { status: 403 });
    }

    // Obtener todas las analíticas de la parcela
    const { data: analiticas, error: analiticasError } = await supabase
      .from('analitica')
      .select('*')
      .eq('id_parcela', parcelaId)
      .order('fecha', { ascending: false })
      .limit(10); // Limitamos a las 10 más recientes

    if (analiticasError) {
      return NextResponse.json({ error: 'Error obteniendo analíticas' }, { status: 500 });
    }

    if (!analiticas || analiticas.length === 0) {
      return NextResponse.json({ 
        error: 'No hay datos de análisis disponibles para esta parcela' 
      }, { status: 400 });
    }

    // Preparar datos para ChatGPT
    const datosParaAnalisis = {
      parcela: {
        cultivo: parcelaData.cultivo,
        hectareas: parcelaData.ha,
        agricultor: agricultor?.nombre
      },
      analiticas: analiticas.map(analitica => ({
        fecha: analitica.fecha,
        resultado: analitica.resultado,
        // No incluimos path_foto por privacidad y límites de tokens
      }))
    };

    // Crear el mensaje para el Assistant
    const mensajeParaAssistant = `
DATOS DE LA PARCELA:
- Cultivo: ${datosParaAnalisis.parcela.cultivo}
- Superficie: ${datosParaAnalisis.parcela.hectareas} hectáreas
- Agricultor: ${datosParaAnalisis.parcela.agricultor}

HISTORIAL DE ANÁLISIS:
${datosParaAnalisis.analiticas.map((a, index) => 
  `${index + 1}. Fecha: ${new Date(a.fecha).toLocaleDateString('es-ES')}
     Resultado: ${a.resultado || 'Sin descripción'}`
).join('\n')}

Por favor, proporciona un análisis detallado de esta parcela agrícola.
`;

    // Usar el Assistant de OpenAI
    const assistantId = process.env.OPENAI_ASSISTANT_ID;
    
    if (!assistantId) {
      return NextResponse.json({ 
        error: 'ID del Assistant de OpenAI no configurado' 
      }, { status: 500 });
    }

    // Crear un thread
    const thread = await openai.beta.threads.create();

    // Agregar el mensaje al thread
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: mensajeParaAssistant
    });

    // Ejecutar el assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId
    });

    // Esperar a que complete la ejecución
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    
    // Polling para esperar la completion (máximo 2 minutos)
    const maxWaitTime = 120000; // 2 minutos
    const startTime = Date.now();
    
    while (runStatus.status === 'queued' || runStatus.status === 'in_progress') {
      if (Date.now() - startTime > maxWaitTime) {
        return NextResponse.json({ 
          error: 'Timeout esperando respuesta del assistant' 
        }, { status: 408 });
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }

    if (runStatus.status !== 'completed') {
      return NextResponse.json({ 
        error: `Error en el assistant: ${runStatus.status}`,
        details: runStatus.last_error?.message 
      }, { status: 500 });
    }

    // Obtener los mensajes del thread
    const messages = await openai.beta.threads.messages.list(thread.id);
    const assistantMessage = messages.data.find(
      message => message.role === 'assistant'
    );

    if (!assistantMessage || !assistantMessage.content[0] || assistantMessage.content[0].type !== 'text') {
      return NextResponse.json({ 
        error: 'No se pudo obtener respuesta del assistant' 
      }, { status: 500 });
    }

    const analisisIA = assistantMessage.content[0].text.value;

    if (!analisisIA) {
      return NextResponse.json({ 
        error: 'No se pudo generar el análisis' 
      }, { status: 500 });
    }

    // Guardar el análisis en la base de datos como una nueva analítica
    const { data: nuevaAnalitica, error: insertError } = await supabase
      .from('analitica')
      .insert({
        id_parcela: parcelaId,
        resultado: `ANÁLISIS IA - ${new Date().toLocaleDateString('es-ES')}\n\nAnálisis generado por Assistant de OpenAI`,
        model_response: analisisIA,
        fecha: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error guardando análisis:', insertError);
      // Continuamos aunque no se pueda guardar
    }

    return NextResponse.json({
      success: true,
      analisis: analisisIA,
      analiticaId: nuevaAnalitica?.id,
      datosAnalizados: analiticas.length,
      fecha: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error en análisis IA:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
} 