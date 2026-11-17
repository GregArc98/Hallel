-- Hallel — vínculo de contas, papéis e Row Level Security
--
-- Regras:
--  • Só quem é integrante ativo de uma igreja enxerga os dados dela.
--  • Só admins alteram dados (exceto indisponibilidade, que o próprio membro marca).
--  • Membros só veem escala e repertório PUBLICADOS.
--  • Indisponibilidade: visível só para a própria pessoa e para os admins.

-- ---------------------------------------------------------------------------
-- Funções auxiliares (security definer evita recursão de RLS em integrante)
-- ---------------------------------------------------------------------------
create function public.minhas_igrejas()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select igreja_id from public.integrante
  where usuario_id = (select auth.uid()) and ativo
$$;

create function public.e_membro(p_igreja uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.integrante
    where igreja_id = p_igreja and usuario_id = (select auth.uid()) and ativo
  )
$$;

create function public.e_admin(p_igreja uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.integrante
    where igreja_id = p_igreja and usuario_id = (select auth.uid()) and ativo and papel = 'admin'
  )
$$;

create function public.meu_integrante(p_igreja uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.integrante
  where igreja_id = p_igreja and usuario_id = (select auth.uid()) and ativo
$$;

-- ---------------------------------------------------------------------------
-- Vínculo automático conta ⇄ integrante pelo e-mail (somente e-mail confirmado)
-- ---------------------------------------------------------------------------

-- Ao cadastrar/alterar o e-mail de um integrante: normaliza e liga à conta, se já existir.
create function public.integrante_vincular_conta()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.email := nullif(lower(btrim(new.email)), '');
  if tg_op = 'UPDATE' and new.email is distinct from old.email then
    new.usuario_id := null;
  end if;
  if new.usuario_id is null and new.email is not null then
    select u.id into new.usuario_id
    from auth.users u
    where lower(u.email) = new.email and u.email_confirmed_at is not null
    limit 1;
  end if;
  return new;
end;
$$;

create trigger integrante_vincular_conta
  before insert or update of email on public.integrante
  for each row execute function public.integrante_vincular_conta();

-- Quando alguém confirma o e-mail (1º login por link mágico ou Google): liga aos cadastros.
create function public.usuario_vincular_integrantes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is not null and new.email_confirmed_at is not null then
    update public.integrante
    set usuario_id = new.id
    where email = lower(new.email) and usuario_id is null;
  end if;
  return new;
end;
$$;

create trigger usuario_vincular_integrantes
  after insert or update of email, email_confirmed_at on auth.users
  for each row execute function public.usuario_vincular_integrantes();

-- Chamável pelo app logo após o login (rede de segurança caso o cadastro seja posterior).
create function public.vincular_minha_conta()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.integrante i
  set usuario_id = u.id
  from auth.users u
  where u.id = (select auth.uid())
    and u.email_confirmed_at is not null
    and i.email = lower(u.email)
    and i.usuario_id is null
$$;

-- ---------------------------------------------------------------------------
-- Proteção: a igreja nunca fica sem admin ativo
-- ---------------------------------------------------------------------------
create function public.garantir_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  alvo uuid := coalesce(old.igreja_id, new.igreja_id);
begin
  -- Só importa quando quem sai (ou é rebaixado/desativado) era admin ativo.
  if not (old.papel = 'admin' and old.ativo) then
    return coalesce(new, old);
  end if;
  -- Exclusão em cascata da igreja inteira: deixa passar.
  if tg_op = 'DELETE' and not exists (select 1 from public.igreja where id = alvo) then
    return old;
  end if;
  if not exists (
    select 1 from public.integrante
    where igreja_id = alvo and papel = 'admin' and ativo
  ) then
    raise exception 'A igreja precisa ter pelo menos um admin ativo'
      using errcode = 'check_violation';
  end if;
  return coalesce(new, old);
end;
$$;

create constraint trigger integrante_garantir_admin
  after update of papel, ativo or delete on public.integrante
  deferrable initially deferred
  for each row execute function public.garantir_admin();

-- ---------------------------------------------------------------------------
-- Publicação: registra quando escala/repertório foram publicados.
-- (Ponto único onde, na fase 2, entram as notificações.)
-- ---------------------------------------------------------------------------
create function public.culto_registrar_publicacao()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.escala_publicada and not coalesce(old.escala_publicada, false) then
    new.escala_publicada_em := now();
  elsif not new.escala_publicada then
    new.escala_publicada_em := null;
  end if;
  if new.repertorio_publicado and not coalesce(old.repertorio_publicado, false) then
    new.repertorio_publicado_em := now();
  elsif not new.repertorio_publicado then
    new.repertorio_publicado_em := null;
  end if;
  return new;
end;
$$;

create trigger culto_registrar_publicacao
  before insert or update of escala_publicada, repertorio_publicado on public.culto
  for each row execute function public.culto_registrar_publicacao();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.igreja enable row level security;
alter table public.integrante enable row level security;
alter table public.funcao enable row level security;
alter table public.integrante_funcao enable row level security;
alter table public.musica enable row level security;
alter table public.culto enable row level security;
alter table public.escala_item enable row level security;
alter table public.setlist_item enable row level security;
alter table public.indisponibilidade enable row level security;

-- igreja
create policy "membros veem a igreja" on public.igreja
  for select to authenticated using (id in (select public.minhas_igrejas()));
create policy "admins editam a igreja" on public.igreja
  for update to authenticated using (public.e_admin(id)) with check (public.e_admin(id));

-- integrante
create policy "membros veem a equipe" on public.integrante
  for select to authenticated using (igreja_id in (select public.minhas_igrejas()));
create policy "admins cadastram integrantes" on public.integrante
  for insert to authenticated with check (public.e_admin(igreja_id));
create policy "admins editam integrantes" on public.integrante
  for update to authenticated using (public.e_admin(igreja_id)) with check (public.e_admin(igreja_id));
create policy "admins removem integrantes" on public.integrante
  for delete to authenticated using (public.e_admin(igreja_id));

-- funcao, integrante_funcao, musica, culto: leitura para membros, escrita para admins
create policy "membros veem funções" on public.funcao
  for select to authenticated using (igreja_id in (select public.minhas_igrejas()));
create policy "admins gerenciam funções" on public.funcao
  for all to authenticated using (public.e_admin(igreja_id)) with check (public.e_admin(igreja_id));

create policy "membros veem quem exerce cada função" on public.integrante_funcao
  for select to authenticated using (igreja_id in (select public.minhas_igrejas()));
create policy "admins gerenciam funções dos integrantes" on public.integrante_funcao
  for all to authenticated using (public.e_admin(igreja_id)) with check (public.e_admin(igreja_id));

create policy "membros veem o acervo" on public.musica
  for select to authenticated using (igreja_id in (select public.minhas_igrejas()));
create policy "admins gerenciam o acervo" on public.musica
  for all to authenticated using (public.e_admin(igreja_id)) with check (public.e_admin(igreja_id));

create policy "membros veem os cultos" on public.culto
  for select to authenticated using (igreja_id in (select public.minhas_igrejas()));
create policy "admins gerenciam cultos" on public.culto
  for all to authenticated using (public.e_admin(igreja_id)) with check (public.e_admin(igreja_id));

-- escala_item: membros só veem escalas publicadas
create policy "membros veem escalas publicadas" on public.escala_item
  for select to authenticated using (
    public.e_admin(igreja_id)
    or (
      igreja_id in (select public.minhas_igrejas())
      and exists (select 1 from public.culto c where c.id = culto_id and c.escala_publicada)
    )
  );
create policy "admins gerenciam escalas" on public.escala_item
  for all to authenticated using (public.e_admin(igreja_id)) with check (public.e_admin(igreja_id));

-- setlist_item: membros só veem repertórios publicados
create policy "membros veem repertórios publicados" on public.setlist_item
  for select to authenticated using (
    public.e_admin(igreja_id)
    or (
      igreja_id in (select public.minhas_igrejas())
      and exists (select 1 from public.culto c where c.id = culto_id and c.repertorio_publicado)
    )
  );
create policy "admins gerenciam repertórios" on public.setlist_item
  for all to authenticated using (public.e_admin(igreja_id)) with check (public.e_admin(igreja_id));

-- indisponibilidade: a própria pessoa e os admins
create policy "cada um vê a própria indisponibilidade; admins veem todas" on public.indisponibilidade
  for select to authenticated using (
    public.e_admin(igreja_id) or integrante_id = public.meu_integrante(igreja_id)
  );
create policy "cada um marca a própria indisponibilidade" on public.indisponibilidade
  for insert to authenticated with check (
    public.e_admin(igreja_id) or integrante_id = public.meu_integrante(igreja_id)
  );
create policy "cada um altera a própria indisponibilidade" on public.indisponibilidade
  for update to authenticated
  using (public.e_admin(igreja_id) or integrante_id = public.meu_integrante(igreja_id))
  with check (public.e_admin(igreja_id) or integrante_id = public.meu_integrante(igreja_id));
create policy "cada um remove a própria indisponibilidade" on public.indisponibilidade
  for delete to authenticated using (
    public.e_admin(igreja_id) or integrante_id = public.meu_integrante(igreja_id)
  );

-- ---------------------------------------------------------------------------
-- Permissões das funções expostas via API
-- ---------------------------------------------------------------------------
revoke execute on function public.minhas_igrejas() from public, anon;
revoke execute on function public.e_membro(uuid) from public, anon;
revoke execute on function public.e_admin(uuid) from public, anon;
revoke execute on function public.meu_integrante(uuid) from public, anon;
revoke execute on function public.vincular_minha_conta() from public, anon;
grant execute on function public.minhas_igrejas() to authenticated;
grant execute on function public.e_membro(uuid) to authenticated;
grant execute on function public.e_admin(uuid) to authenticated;
grant execute on function public.meu_integrante(uuid) to authenticated;
grant execute on function public.vincular_minha_conta() to authenticated;

-- Funções de gatilho não devem ser chamadas pela API.
revoke execute on function public.integrante_vincular_conta() from public, anon, authenticated;
revoke execute on function public.usuario_vincular_integrantes() from public, anon, authenticated;
revoke execute on function public.garantir_admin() from public, anon, authenticated;
