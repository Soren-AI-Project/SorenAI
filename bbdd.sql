-- Tabla Empresa
create table public.empresa (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  cif text not null
);

-- Tabla Admin
create table public.admin (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  id_empresa uuid not null references public.empresa(id) on delete cascade,
  nombre text not null,
  nombre_empresa text,
  unique(user_id)
);

-- Tabla Tecnico
create table public.tecnico (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  id_admin uuid not null references public.admin(id) on delete cascade,
  nombre text not null,
  unique(user_id)
);

-- Tabla Agricultor
create table public.agricultor (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null,
  id_tecnico uuid references public.tecnico(id) on delete set null,
  unique(user_id)
);

-- (Opcional) Si quieres permitir que un usuario tenga varios perfiles, crea tablas junction:
-- Usuario_Admin
create table public.usuario_admin (
  user_id uuid not null references auth.users(id) on delete cascade,
  admin_id uuid not null references public.admin(id) on delete cascade,
  primary key (user_id, admin_id)
);

-- Usuario_Tecnico
create table public.usuario_tecnico (
  user_id uuid not null references auth.users(id) on delete cascade,
  tecnico_id uuid not null references public.tecnico(id) on delete cascade,
  primary key (user_id, tecnico_id)
);

-- Usuario_Agricultor
create table public.usuario_agricultor (
  user_id uuid not null references auth.users(id) on delete cascade,
  agricultor_id uuid not null references public.agricultor(id) on delete cascade,
  primary key (user_id, agricultor_id)
);

-- Tabla Parcela
create table public.parcela (
  id uuid primary key default gen_random_uuid(),
  id_agricultor uuid not null references public.agricultor(id) on delete cascade,
  cultivo text not null,
  ha float,
  estado boolean not null default true
);

-- Tabla Analitica
create table public.analitica (
  id uuid primary key default gen_random_uuid(),
  id_parcela uuid not null references public.parcela(id) on delete cascade,
  path_foto text,
  resultado text,
  fecha timestamp with time zone default now()
);

-- Tabla Mensajes
create table public.mensaje (
  id uuid primary key default gen_random_uuid(),
  remitente_tipo text not null, -- 'admin', 'tecnico', 'agricultor'
  remitente_admin_id uuid references public.admin(id) on delete set null,
  remitente_tecnico_id uuid references public.tecnico(id) on delete set null,
  remitente_agricultor_id uuid references public.agricultor(id) on delete set null,
  destinatario_tipo text not null, -- 'admin', 'tecnico', 'agricultor'
  destinatario_admin_id uuid references public.admin(id) on delete set null,
  destinatario_tecnico_id uuid references public.tecnico(id) on delete set null,
  destinatario_agricultor_id uuid references public.agricultor(id) on delete set null,
  asunto text not null,
  contenido text not null,
  leido boolean not null default false,
  fecha_envio timestamp with time zone default now(),
  
  -- Restricciones para validar que solo un tipo de remitente y destinatario esté presente
  constraint check_un_remitente check (
    (remitente_tipo = 'admin' AND remitente_admin_id IS NOT NULL AND remitente_tecnico_id IS NULL AND remitente_agricultor_id IS NULL) OR
    (remitente_tipo = 'tecnico' AND remitente_tecnico_id IS NOT NULL AND remitente_admin_id IS NULL AND remitente_agricultor_id IS NULL) OR
    (remitente_tipo = 'agricultor' AND remitente_agricultor_id IS NOT NULL AND remitente_admin_id IS NULL AND remitente_tecnico_id IS NULL)
  ),
  
  constraint check_un_destinatario check (
    (destinatario_tipo = 'admin' AND destinatario_admin_id IS NOT NULL AND destinatario_tecnico_id IS NULL AND destinatario_agricultor_id IS NULL) OR
    (destinatario_tipo = 'tecnico' AND destinatario_tecnico_id IS NOT NULL AND destinatario_admin_id IS NULL AND destinatario_agricultor_id IS NULL) OR
    (destinatario_tipo = 'agricultor' AND destinatario_agricultor_id IS NOT NULL AND destinatario_admin_id IS NULL AND destinatario_tecnico_id IS NULL)
  )
);

-- Crear índices para búsquedas eficientes
create index idx_mensaje_remitente_tipo on public.mensaje(remitente_tipo);
create index idx_mensaje_remitente_admin on public.mensaje(remitente_admin_id) where remitente_admin_id is not null;
create index idx_mensaje_remitente_tecnico on public.mensaje(remitente_tecnico_id) where remitente_tecnico_id is not null;
create index idx_mensaje_remitente_agricultor on public.mensaje(remitente_agricultor_id) where remitente_agricultor_id is not null;

create index idx_mensaje_destinatario_tipo on public.mensaje(destinatario_tipo);
create index idx_mensaje_destinatario_admin on public.mensaje(destinatario_admin_id) where destinatario_admin_id is not null;
create index idx_mensaje_destinatario_tecnico on public.mensaje(destinatario_tecnico_id) where destinatario_tecnico_id is not null;
create index idx_mensaje_destinatario_agricultor on public.mensaje(destinatario_agricultor_id) where destinatario_agricultor_id is not null;

create index idx_mensaje_fecha on public.mensaje(fecha_envio);
create index idx_mensaje_leido on public.mensaje(leido);

-- ===============================
-- TRIGGERS PARA AUTOMATIZAR INSERCIÓN EN TABLAS INTERMEDIAS
-- ===============================

-- Trigger para poblar automáticamente usuario_tecnico cuando se crea un técnico
CREATE OR REPLACE FUNCTION public.handle_new_tecnico()
RETURNS TRIGGER AS $$
BEGIN
  -- Insertar en la tabla intermedia usuario_tecnico
  INSERT INTO public.usuario_tecnico (user_id, tecnico_id)
  VALUES (NEW.user_id, NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear el trigger
CREATE TRIGGER on_tecnico_created
  AFTER INSERT ON public.tecnico
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_tecnico();

-- Trigger para poblar automáticamente usuario_admin cuando se crea un admin
CREATE OR REPLACE FUNCTION public.handle_new_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Insertar en la tabla intermedia usuario_admin
  INSERT INTO public.usuario_admin (user_id, admin_id)
  VALUES (NEW.user_id, NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear el trigger
CREATE TRIGGER on_admin_created
  AFTER INSERT ON public.admin
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_admin();

-- Trigger para poblar automáticamente usuario_agricultor cuando se crea un agricultor
CREATE OR REPLACE FUNCTION public.handle_new_agricultor()
RETURNS TRIGGER AS $$
BEGIN
  -- Insertar en la tabla intermedia usuario_agricultor
  INSERT INTO public.usuario_agricultor (user_id, agricultor_id)
  VALUES (NEW.user_id, NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear el trigger
CREATE TRIGGER on_agricultor_created
  AFTER INSERT ON public.agricultor
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_agricultor();

-- ===============================
-- FUNCIÓN PARA CREAR TÉCNICO COMPLETO
-- ===============================

-- Función para crear un técnico completo (usuario + perfil + relaciones)
CREATE OR REPLACE FUNCTION public.crear_tecnico_completo(
  p_email text,
  p_password text,
  p_nombre text,
  p_admin_id uuid
)
RETURNS json AS $$
DECLARE
  new_user_id uuid;
  new_tecnico_id uuid;
  result json;
BEGIN
  -- Crear el usuario en auth.users (esto debe ser llamado desde el lado del cliente con Supabase Auth)
  -- Esta función asume que el usuario ya fue creado en auth.users
  
  -- Buscar el user_id por email (asumiendo que el usuario ya fue creado)
  SELECT id INTO new_user_id 
  FROM auth.users 
  WHERE email = p_email;
  
  IF new_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuario no encontrado. Debe crearse primero en auth.users'
    );
  END IF;
  
  -- Verificar que no exista ya un perfil para este usuario
  IF EXISTS (SELECT 1 FROM public.tecnico WHERE user_id = new_user_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Ya existe un técnico con este email'
    );
  END IF;
  
  -- Crear el perfil de técnico
  INSERT INTO public.tecnico (user_id, id_admin, nombre)
  VALUES (new_user_id, p_admin_id, p_nombre)
  RETURNING id INTO new_tecnico_id;
  
  -- Los triggers automáticamente poblarán la tabla usuario_tecnico
  
  -- Retornar resultado exitoso
  result := json_build_object(
    'success', true,
    'tecnico_id', new_tecnico_id,
    'user_id', new_user_id,
    'message', 'Técnico creado exitosamente'
  );
  
  RETURN result;
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================
-- FUNCIÓN PARA VERIFICAR SI USUARIO ES ADMIN (SEGURA)
-- ===============================

CREATE OR REPLACE FUNCTION public.is_user_admin(user_id_param uuid)
RETURNS json AS $$
DECLARE
  admin_record record;
BEGIN
  -- Verificar si el usuario es admin
  SELECT id, id_empresa INTO admin_record 
  FROM public.admin 
  WHERE user_id = user_id_param;
  
  IF admin_record.id IS NOT NULL THEN
    RETURN json_build_object(
      'is_admin', true,
      'admin_id', admin_record.id,
      'empresa_id', admin_record.id_empresa
    );
  ELSE
    RETURN json_build_object(
      'is_admin', false
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================
-- POLÍTICAS RLS (Row Level Security)
-- ===============================

-- Habilitar RLS en las tablas principales
ALTER TABLE public.tecnico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agricultor ENABLE ROW LEVEL SECURITY;

-- Política para que los admins puedan ver y gestionar técnicos de su empresa
CREATE POLICY "Admins pueden gestionar técnicos de su empresa" ON public.tecnico
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin 
      WHERE admin.id = tecnico.id_admin 
      AND admin.user_id = auth.uid()
    )
  );

-- Política para que los técnicos puedan ver su propio perfil
CREATE POLICY "Técnicos pueden ver su propio perfil" ON public.tecnico
  FOR SELECT USING (user_id = auth.uid());

-- Política para que los admins puedan ver su propio perfil
CREATE POLICY "Admins pueden ver su propio perfil" ON public.admin
  FOR SELECT USING (user_id = auth.uid());

-- NUEVA: Política para verificación de roles (segura)
CREATE POLICY "Verificación de roles admin" ON public.admin
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Políticas para tablas intermedias
ALTER TABLE public.usuario_tecnico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuario_admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuario_agricultor ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden ver sus propias relaciones
CREATE POLICY "Usuarios pueden ver sus relaciones técnico" ON public.usuario_tecnico
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Usuarios pueden ver sus relaciones admin" ON public.usuario_admin
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Usuarios pueden ver sus relaciones agricultor" ON public.usuario_agricultor
  FOR SELECT USING (user_id = auth.uid());
