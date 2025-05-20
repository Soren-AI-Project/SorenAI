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
  ha float
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
