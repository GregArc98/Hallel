-- Imitação mínima do ambiente Supabase para testar migrações num Postgres comum.
-- (Não é aplicado no Supabase de verdade.)
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema extensions;
create schema auth;
grant usage on schema public, extensions, auth to anon, authenticated, service_role;

create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  email_confirmed_at timestamptz
);

-- Como no Supabase: o JWT chega em request.jwt.claims.
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true)::json ->> 'sub', '')::uuid
$$;
create function auth.email() returns text language sql stable as $$
  select current_setting('request.jwt.claims', true)::json ->> 'email'
$$;

-- Privilégios padrão do Supabase no schema public.
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
