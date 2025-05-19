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
