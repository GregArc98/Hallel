-- Cadastro feito pela própria pessoa, com aprovação do líder.
--
--  • A igreja tem um código de convite (link único para o grupo do WhatsApp).
--  • Quem entra pelo link cria o próprio perfil (nome, e-mail do login, WhatsApp) e fica
--    PENDENTE (aprovado = false, ativo = false) até um líder aprovar e definir papel/funções.
--  • Cada pessoa pode editar o próprio nome e WhatsApp; papel, funções e ativo seguem só com líderes.
--  • Último acesso fica numa tabela à parte, visível só para líderes.

-- ---------------------------------------------------------------------------
-- Convite da igreja
-- ---------------------------------------------------------------------------
alter table public.igreja
  add column codigo_convite text not null unique
    default replace(gen_random_uuid()::text, '-', ''),
  add column convite_ativo boolean not null default true;

-- ---------------------------------------------------------------------------
-- Integrante pendente
-- ---------------------------------------------------------------------------
alter table public.integrante add column aprovado boolean not null default true;

-- Permissões consideram só integrantes aprovados e ativos.
create or replace function privado.minhas_igrejas()
returns setof uuid language sql stable security definer set search_path = '' as $$
  select igreja_id from public.integrante
  where usuario_id = (select auth.uid()) and ativo and aprovado
$$;

create or replace function privado.e_membro(p_igreja uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.integrante
    where igreja_id = p_igreja and usuario_id = (select auth.uid()) and ativo and aprovado
  )
$$;

create or replace function privado.e_admin(p_igreja uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.integrante
    where igreja_id = p_igreja and usuario_id = (select auth.uid()) and ativo and aprovado and papel = 'admin'
  )
$$;

create or replace function privado.meu_integrante(p_igreja uuid)
returns uuid language sql stable security definer set search_path = '' as $$
  select id from public.integrante
  where igreja_id = p_igreja and usuario_id = (select auth.uid()) and ativo and aprovado
$$;

-- A pessoa enxerga o próprio cadastro mesmo pendente (para saber que está aguardando).
create policy "cada um vê o próprio cadastro" on public.integrante
  for select to authenticated using (usuario_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Funções chamadas pelo app
-- ---------------------------------------------------------------------------

-- Nome da igreja de um convite válido (mostrado antes do login).
create function public.igreja_do_convite(p_codigo text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select nome from public.igreja where codigo_convite = p_codigo and convite_ativo
$$;

-- Entrar na equipe pelo link: cria o perfil pendente, ou liga a conta a um cadastro
-- que o líder já tinha feito com este e-mail. Retorna 'pendente' ou 'aprovado'.
create function public.entrar_na_equipe(p_codigo text, p_nome text, p_telefone text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_igreja uuid;
  v_uid uuid := (select auth.uid());
  v_email text;
  v_existente public.integrante%rowtype;
begin
  if v_uid is null then
    raise exception 'Entre com seu e-mail antes' using errcode = '42501';
  end if;
  select id into v_igreja from public.igreja where codigo_convite = p_codigo and convite_ativo;
  if v_igreja is null then
    raise exception 'Convite inválido ou desativado' using errcode = 'P0002';
  end if;
  select lower(email) into v_email from auth.users where id = v_uid and email_confirmed_at is not null;
  if v_email is null then
    raise exception 'E-mail não confirmado' using errcode = '42501';
  end if;
  if coalesce(btrim(p_nome), '') = '' or length(p_nome) > 80 then
    raise exception 'Informe seu nome' using errcode = '22023';
  end if;

  select * into v_existente from public.integrante
  where igreja_id = v_igreja and (usuario_id = v_uid or email = v_email)
  order by (usuario_id = v_uid) desc nulls last
  limit 1;

  if found then
    update public.integrante
    set usuario_id = v_uid,
        nome = case when aprovado then nome else btrim(p_nome) end,
        telefone = coalesce(nullif(btrim(p_telefone), ''), telefone)
    where id = v_existente.id;
    return case when v_existente.aprovado then 'aprovado' else 'pendente' end;
  end if;

  insert into public.integrante (igreja_id, usuario_id, nome, email, telefone, papel, ativo, aprovado)
  values (v_igreja, v_uid, btrim(p_nome), v_email, nullif(btrim(p_telefone), ''), 'membro', false, false);
  return 'pendente';
end;
$$;

-- Cada um edita o próprio nome e WhatsApp (papel, funções e ativo não).
create function public.atualizar_meu_perfil(p_igreja uuid, p_nome text, p_telefone text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(btrim(p_nome), '') = '' or length(p_nome) > 80 then
    raise exception 'Informe seu nome' using errcode = '22023';
  end if;
  update public.integrante
  set nome = btrim(p_nome), telefone = nullif(btrim(p_telefone), '')
  where igreja_id = p_igreja and usuario_id = (select auth.uid());
end;
$$;

-- ---------------------------------------------------------------------------
-- Último acesso (só líderes veem)
-- ---------------------------------------------------------------------------
create table public.acesso_integrante (
  integrante_id uuid primary key,
  igreja_id uuid not null,
  ultimo_em timestamptz not null default now(),
  foreign key (integrante_id, igreja_id) references public.integrante (id, igreja_id) on delete cascade
);
create index acesso_integrante_igreja_idx on public.acesso_integrante (igreja_id);
alter table public.acesso_integrante enable row level security;
create policy "só líderes veem o último acesso" on public.acesso_integrante
  for select to authenticated using (privado.e_admin(igreja_id));

-- Registra o acesso de quem está usando o app (no máximo uma escrita por hora).
create function public.registrar_acesso(p_igreja uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.acesso_integrante (integrante_id, igreja_id, ultimo_em)
  select id, igreja_id, now() from public.integrante
  where igreja_id = p_igreja and usuario_id = (select auth.uid()) and ativo and aprovado
  on conflict (integrante_id) do update set ultimo_em = excluded.ultimo_em
  where public.acesso_integrante.ultimo_em < now() - interval '1 hour'
$$;

-- Líder gera um novo link (o antigo para de funcionar).
create function public.renovar_convite(p_igreja uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_codigo text := replace(gen_random_uuid()::text, '-', '');
begin
  if not privado.e_admin(p_igreja) then
    raise exception 'Apenas líderes' using errcode = '42501';
  end if;
  update public.igreja set codigo_convite = v_codigo, convite_ativo = true where id = p_igreja;
  return v_codigo;
end;
$$;

revoke execute on function public.igreja_do_convite(text) from public;
grant execute on function public.igreja_do_convite(text) to anon, authenticated;
revoke execute on function public.entrar_na_equipe(text, text, text) from public, anon;
grant execute on function public.entrar_na_equipe(text, text, text) to authenticated;
revoke execute on function public.atualizar_meu_perfil(uuid, text, text) from public, anon;
grant execute on function public.atualizar_meu_perfil(uuid, text, text) to authenticated;
revoke execute on function public.registrar_acesso(uuid) from public, anon;
grant execute on function public.registrar_acesso(uuid) to authenticated;
revoke execute on function public.renovar_convite(uuid) from public, anon;
grant execute on function public.renovar_convite(uuid) to authenticated;
