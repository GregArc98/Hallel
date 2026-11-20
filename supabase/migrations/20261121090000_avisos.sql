-- Avisos: notificação no celular (Web Push) e por e-mail quando a escala ou o repertório é publicado.
--
--  • Cada aparelho que ativa os avisos guarda uma inscrição (inscricao_push), ligada à conta.
--  • O e-mail é ligado por padrão; cada pessoa pode desligar no Perfil (integrante.avisos_email).
--  • Quem envia é o servidor do app, no momento em que um líder publica. As funções abaixo só
--    entregam destinatários e inscrições a líderes da igreja.

-- ---------------------------------------------------------------------------
-- Inscrições dos aparelhos
-- ---------------------------------------------------------------------------
create table public.inscricao_push (
  endpoint text primary key check (endpoint like 'https://%' and length(endpoint) <= 1000),
  usuario_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  p256dh text not null check (length(p256dh) <= 200),
  auth text not null check (length(auth) <= 100),
  criado_em timestamptz not null default now()
);
create index inscricao_push_usuario_idx on public.inscricao_push (usuario_id);
alter table public.inscricao_push enable row level security;

create policy "cada um vê as próprias inscrições" on public.inscricao_push
  for select to authenticated using (usuario_id = (select auth.uid()));
create policy "cada um cria as próprias inscrições" on public.inscricao_push
  for insert to authenticated with check (usuario_id = (select auth.uid()));
create policy "cada um atualiza as próprias inscrições" on public.inscricao_push
  for update to authenticated using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()));
create policy "cada um apaga as próprias inscrições" on public.inscricao_push
  for delete to authenticated using (usuario_id = (select auth.uid()));

grant select, insert, update, delete on public.inscricao_push to authenticated;

-- ---------------------------------------------------------------------------
-- Preferência de e-mail
-- ---------------------------------------------------------------------------
alter table public.integrante add column avisos_email boolean not null default true;

create function public.definir_avisos_email(p_igreja uuid, p_ativo boolean)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.integrante set avisos_email = p_ativo
  where igreja_id = p_igreja and usuario_id = (select auth.uid())
$$;

-- ---------------------------------------------------------------------------
-- Para o envio (só líderes)
-- ---------------------------------------------------------------------------

-- Quem está escalado nos cultos (e em quê), com e-mail só para quem quer receber.
create function public.avisos_destinatarios(p_igreja uuid, p_cultos uuid[])
returns table (integrante_id uuid, nome text, email text, culto_id uuid, funcao text, ordem smallint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not privado.e_admin(p_igreja) then
    raise exception 'Apenas líderes' using errcode = '42501';
  end if;
  return query
    select i.id, i.nome, case when i.avisos_email then i.email end, e.culto_id, f.nome, f.ordem
    from public.escala_item e
    join public.integrante i on i.id = e.integrante_id
    join public.funcao f on f.id = e.funcao_id
    where e.igreja_id = p_igreja
      and e.culto_id = any (p_cultos)
      and i.ativo and i.aprovado and i.usuario_id is not null
    order by i.nome, e.culto_id, f.ordem;
end;
$$;

-- Aparelhos inscritos de integrantes da igreja.
create function public.avisos_inscricoes(p_igreja uuid, p_integrantes uuid[])
returns table (integrante_id uuid, endpoint text, p256dh text, auth text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not privado.e_admin(p_igreja) then
    raise exception 'Apenas líderes' using errcode = '42501';
  end if;
  return query
    select i.id, s.endpoint, s.p256dh, s.auth
    from public.integrante i
    join public.inscricao_push s on s.usuario_id = i.usuario_id
    where i.igreja_id = p_igreja and i.id = any (p_integrantes);
end;
$$;

-- Remove inscrições que o serviço de push disse que não existem mais (aparelho trocado,
-- permissão retirada). Só de integrantes da igreja do líder.
create function public.avisos_remover_inscricoes(p_igreja uuid, p_endpoints text[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not privado.e_admin(p_igreja) then
    raise exception 'Apenas líderes' using errcode = '42501';
  end if;
  delete from public.inscricao_push s
  using public.integrante i
  where s.endpoint = any (p_endpoints) and s.usuario_id = i.usuario_id and i.igreja_id = p_igreja;
end;
$$;

revoke execute on function public.definir_avisos_email(uuid, boolean) from public, anon;
grant execute on function public.definir_avisos_email(uuid, boolean) to authenticated;
revoke execute on function public.avisos_destinatarios(uuid, uuid[]) from public, anon;
grant execute on function public.avisos_destinatarios(uuid, uuid[]) to authenticated;
revoke execute on function public.avisos_inscricoes(uuid, uuid[]) from public, anon;
grant execute on function public.avisos_inscricoes(uuid, uuid[]) to authenticated;
revoke execute on function public.avisos_remover_inscricoes(uuid, text[]) from public, anon;
grant execute on function public.avisos_remover_inscricoes(uuid, text[]) to authenticated;
