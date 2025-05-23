-- Script para actualizar la base de datos con los cambios necesarios
-- Ejecutar este script en la consola SQL de Supabase

-- 1. Agregar la columna estado a la tabla parcela
ALTER TABLE public.parcela 
ADD COLUMN IF NOT EXISTS estado boolean NOT NULL DEFAULT true;

-- 2. Actualizar las parcelas existentes para que tengan estado = true
UPDATE public.parcela 
SET estado = true 
WHERE estado IS NULL;

-- 3. Crear índice para mejorar las consultas por estado
CREATE INDEX IF NOT EXISTS idx_parcela_estado ON public.parcela(estado);

-- Verificar que los cambios se aplicaron correctamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'parcela' AND table_schema = 'public'
ORDER BY ordinal_position; 