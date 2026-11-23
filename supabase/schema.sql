-- =============================================================
-- Not a runner · Base de datos (Supabase)
-- Cómo usarlo: Supabase > SQL Editor > New query > pega TODO > Run.
-- Se puede correr varias veces sin romper nada.
-- Tablas: profiles, routes, runs, schedules, reports, report_confirmations
-- =============================================================

-- ---------- PERFILES (uno por usuario) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null default 'Corredor',
  ciudad text not null default 'Monterrey, Nuevo León',
  foto_url text,
  creado_en timestamptz not null default now()
);

-- Al registrarse, se crea su perfil con el nombre y la ciudad del formulario
create or replace function public.crear_perfil()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nombre, ciudad)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'nombre', ''), 'Corredor'),
    coalesce(nullif(new.raw_user_meta_data ->> 'ciudad', ''), 'Monterrey, Nuevo León')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists al_crear_usuario on auth.users;
create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.crear_perfil();

-- ---------- RUTAS PUBLICADAS POR USUARIOS ----------
-- Las rutas oficiales viven en data/rutas.json (dentro de la app).
-- Aquí solo se guardan las que comparten los usuarios desde "Crear ruta".
create table if not exists public.routes (
  id text primary key default gen_random_uuid()::text,
  nombre text not null,
  descripcion text,
  distancia_km numeric not null default 0,
  desnivel_m numeric not null default 0,
  superficie text,
  sombra_pct integer not null default 0,
  fuentes_agua integer not null default 0,
  iluminacion_pct integer not null default 0,
  puntos_medicos integer not null default 0,
  solo_am boolean not null default false,
  aviso_horario text,
  lat_inicio double precision,
  lng_inicio double precision,
  geojson jsonb,
  imagen_url text,
  publica boolean not null default true,
  sombra_nivel text check (sombra_nivel in ('sol_total', 'mixta', 'mucha_sombra', 'noche')),
  fuentes_funcionales boolean not null default true,
  notas text,
  creada_por uuid references auth.users (id) on delete set null default auth.uid(),
  creado_en timestamptz not null default now()
);

-- ---------- CARRERAS ----------
create table if not exists public.runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  route_id text,
  ruta_nombre text,
  inicio timestamptz,
  fin timestamptz,
  duracion_seg integer not null default 0,
  distancia_km numeric not null default 0,
  ritmo_min_km numeric,
  trayecto jsonb,
  sensacion_termica numeric,
  creado_en timestamptz not null default now()
);

-- ---------- CARRERAS PROGRAMADAS ----------
create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  fecha date not null,
  hora text not null,
  distancia_km numeric not null,
  notas text,
  avisar boolean not null default false,
  creado_en timestamptz not null default now()
);

-- ---------- COMENTARIOS DE LA COMUNIDAD ----------
-- (la tabla se llama reports por el contrato; cada fila es un comentario)
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  autor_nombre text not null,
  route_id text,
  ruta_nombre text not null,
  categoria text not null default 'comentario',
  texto text not null check (char_length(texto) between 3 and 500),
  confirmaciones integer not null default 0,
  creado_en timestamptz not null default now()
);

create table if not exists public.report_confirmations (
  report_id uuid not null references public.reports (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  creado_en timestamptz not null default now(),
  primary key (report_id, user_id)
);

-- "Me sirve": suma 1 solo si ese usuario no lo había confirmado
create or replace function public.confirmar_reporte(rid uuid)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  total integer;
begin
  if auth.uid() is null then
    raise exception 'Inicia sesión para confirmar.';
  end if;
  insert into public.report_confirmations (report_id, user_id)
  values (rid, auth.uid())
  on conflict do nothing;
  if found then
    update public.reports set confirmaciones = confirmaciones + 1 where id = rid;
  end if;
  select confirmaciones into total from public.reports where id = rid;
  return total;
end;
$$;

-- =============================================================
-- SEGURIDAD (RLS): cada quien solo ve y cambia lo suyo
-- =============================================================
alter table public.profiles enable row level security;
alter table public.routes enable row level security;
alter table public.runs enable row level security;
alter table public.schedules enable row level security;
alter table public.reports enable row level security;
alter table public.report_confirmations enable row level security;

-- Perfiles: todos los usuarios con sesión los ven; cada quien edita el suyo
drop policy if exists "perfiles_ver" on public.profiles;
create policy "perfiles_ver" on public.profiles for select to authenticated using (true);
drop policy if exists "perfiles_editar" on public.profiles;
create policy "perfiles_editar" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Rutas: se ven las públicas y las propias; cada quien crea, edita y borra las suyas
drop policy if exists "rutas_ver" on public.routes;
create policy "rutas_ver" on public.routes for select to authenticated
  using (publica or creada_por = auth.uid());
drop policy if exists "rutas_crear" on public.routes;
create policy "rutas_crear" on public.routes for insert to authenticated
  with check (creada_por = auth.uid());
drop policy if exists "rutas_editar" on public.routes;
create policy "rutas_editar" on public.routes for update to authenticated
  using (creada_por = auth.uid()) with check (creada_por = auth.uid());
drop policy if exists "rutas_borrar" on public.routes;
create policy "rutas_borrar" on public.routes for delete to authenticated
  using (creada_por = auth.uid());

-- Carreras y carreras programadas: solo su dueño
drop policy if exists "carreras_duenio" on public.runs;
create policy "carreras_duenio" on public.runs for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "programadas_duenio" on public.schedules;
create policy "programadas_duenio" on public.schedules for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Comentarios: todos los ven; cada quien publica, edita y borra los suyos
drop policy if exists "comentarios_ver" on public.reports;
create policy "comentarios_ver" on public.reports for select to authenticated using (true);
drop policy if exists "comentarios_crear" on public.reports;
create policy "comentarios_crear" on public.reports for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists "comentarios_editar" on public.reports;
create policy "comentarios_editar" on public.reports for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "comentarios_borrar" on public.reports;
create policy "comentarios_borrar" on public.reports for delete to authenticated
  using (user_id = auth.uid());

-- Confirmaciones: todos las ven; solo se crean a nombre propio
drop policy if exists "confirmaciones_ver" on public.report_confirmations;
create policy "confirmaciones_ver" on public.report_confirmations for select to authenticated using (true);
drop policy if exists "confirmaciones_crear" on public.report_confirmations;
create policy "confirmaciones_crear" on public.report_confirmations for insert to authenticated
  with check (user_id = auth.uid());

-- Índices para que las consultas sean rápidas
create index if not exists runs_user_idx on public.runs (user_id, inicio desc);
create index if not exists schedules_user_idx on public.schedules (user_id, fecha);
create index if not exists reports_fecha_idx on public.reports (creado_en desc);
create index if not exists routes_publica_idx on public.routes (publica, creado_en desc);
