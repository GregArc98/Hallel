-- Testes das regras de acesso. Cada bloco falha com exceção se a regra não valer.
\set ON_ERROR_STOP on
\set QUIET on

create schema teste;
create function teste.como(p_email text) returns void language plpgsql as $$
declare uid uuid;
begin
  select id into uid from auth.users where email = p_email;
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'email', p_email)::text, false);
  set role authenticated;
end $$;
create function teste.anonimo() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '', false);
  set role anon;
end $$;
create function teste.checar(condicao boolean, descricao text) returns void language plpgsql as $$
begin
  if not condicao then raise exception 'FALHOU: %', descricao; end if;
  raise notice 'ok: %', descricao;
end $$;
grant usage on schema teste to anon, authenticated;
grant execute on all functions in schema teste to anon, authenticated;

-- Preparação (como superusuário): líder com e-mail cadastrado antes do login,
-- membro que faz login antes de ser cadastrado, e um estranho.
update public.integrante set email = 'lider@exemplo.com' where nome = 'Matheus';
update public.integrante set papel = 'admin' where nome = 'Matheus';
insert into auth.users (email, email_confirmed_at) values ('lider@exemplo.com', now());
insert into auth.users (email, email_confirmed_at) values ('breno@exemplo.com', now());
insert into auth.users (email, email_confirmed_at) values ('estranho@exemplo.com', now());
insert into auth.users (email) values ('naoconfirmado@exemplo.com');
update public.integrante set email = ' Breno@Exemplo.com ' where nome = 'Breno';
update public.integrante set email = 'naoconfirmado@exemplo.com' where nome = 'Yan';

-- Igreja de outra cidade, para testar isolamento entre tenants.
insert into public.igreja (id, nome, slug) values ('00000000-0000-0000-0000-0000000000aa', 'Outra Igreja', 'outra');
insert into public.musica (igreja_id, titulo) values ('00000000-0000-0000-0000-0000000000aa', 'Música de outra igreja');

-- Culto em rascunho (não publicado)
insert into public.culto (igreja_id, data, periodo)
  select igreja_id, '2026-11-22', 'noite' from public.integrante where nome = 'Breno';
insert into public.escala_item (igreja_id, culto_id, funcao_id, integrante_id)
  select c.igreja_id, c.id, f.id, i.id from public.culto c
  join public.funcao f on f.igreja_id = c.igreja_id and f.nome = 'Bateria'
  join public.integrante i on i.igreja_id = c.igreja_id and i.nome = 'Breno'
  where c.data = '2026-11-22';
insert into public.indisponibilidade (igreja_id, integrante_id, data, motivo)
  select igreja_id, id, '2026-11-29', 'viagem' from public.integrante where nome = 'Daniel';

select teste.checar(
  (select usuario_id is not null from public.integrante where nome = 'Matheus'),
  'conta criada depois do cadastro é vinculada pelo e-mail');
select teste.checar(
  (select email = 'breno@exemplo.com' and usuario_id is not null from public.integrante where nome = 'Breno'),
  'e-mail é normalizado e cadastro posterior à conta também vincula');
select teste.checar(
  (select usuario_id is null from public.integrante where nome = 'Yan'),
  'e-mail não confirmado não vincula');

-- Anônimo não vê nada
select teste.anonimo();
select teste.checar((select count(*) = 0 from public.musica), 'anônimo não vê músicas');
select teste.checar((select count(*) = 0 from public.integrante), 'anônimo não vê integrantes');
reset role;

-- Estranho logado (sem cadastro) não vê nada
select teste.como('estranho@exemplo.com');
select teste.checar((select count(*) = 0 from public.musica), 'logado sem cadastro não vê músicas');
select teste.checar((select count(*) = 0 from public.igreja), 'logado sem cadastro não vê igrejas');
reset role;

-- Membro (Breno)
select teste.como('breno@exemplo.com');
select teste.checar((select count(*) = 6 from public.musica), 'membro vê o acervo da própria igreja (e só dela)');
select teste.checar((select count(*) = 10 from public.integrante), 'membro vê a equipe');
select teste.checar((select count(*) = 2 from public.culto), 'membro vê os cultos');
select teste.checar((select count(*) = 5 from public.escala_item), 'membro vê só a escala publicada');
select teste.checar((select count(*) = 6 from public.setlist_item), 'membro vê o repertório publicado');
select teste.checar((select count(*) = 0 from public.indisponibilidade), 'membro não vê indisponibilidade dos outros');
select teste.checar(not privado.e_admin((select id from public.igreja where slug = 'louvor')), 'membro não é admin');
update public.musica set titulo = 'hackeado';
select teste.checar((select count(*) = 0 from public.musica where titulo = 'hackeado'), 'membro não altera músicas');
do $$ begin
  insert into public.musica (igreja_id, titulo) select id, 'nova' from public.igreja limit 1;
  raise exception 'FALHOU: membro conseguiu inserir música';
exception when insufficient_privilege then raise notice 'ok: membro não insere músicas';
end $$;
insert into public.indisponibilidade (igreja_id, integrante_id, data)
  select igreja_id, id, '2026-12-06' from public.integrante where nome = 'Breno';
select teste.checar((select count(*) = 1 from public.indisponibilidade), 'membro marca e vê a própria indisponibilidade');
do $$ begin
  insert into public.indisponibilidade (igreja_id, integrante_id, data)
    select igreja_id, id, '2026-12-06' from public.integrante where nome = 'Grazi';
  raise exception 'FALHOU: membro marcou indisponibilidade de outra pessoa';
exception when insufficient_privilege then raise notice 'ok: membro não marca indisponibilidade dos outros';
end $$;
update public.integrante set papel = 'admin' where nome = 'Breno';
select teste.checar((select papel = 'membro' from public.integrante where nome = 'Breno'), 'membro não se promove a admin');
reset role;

-- Admin (Matheus)
select teste.como('lider@exemplo.com');
select teste.checar((select count(*) = 6 from public.escala_item), 'admin vê também escala em rascunho');
select teste.checar((select count(*) = 2 from public.indisponibilidade), 'admin vê todas as indisponibilidades');
update public.musica set bpm = 72 where titulo = 'Grande É o Senhor';
select teste.checar((select bpm = 72 from public.musica where titulo = 'Grande É o Senhor'), 'admin altera músicas');
update public.musica set titulo = 'invadido' where titulo = 'Música de outra igreja';
reset role;
select teste.checar((select count(*) = 0 from public.musica where titulo = 'invadido'), 'admin não altera dados de outra igreja');
select teste.como('lider@exemplo.com');
do $$ begin
  insert into public.musica (igreja_id, titulo) values ('00000000-0000-0000-0000-0000000000aa', 'intrusa');
  raise exception 'FALHOU: admin inseriu em outra igreja';
exception when insufficient_privilege then raise notice 'ok: admin não insere em outra igreja';
end $$;
do $$ begin
  update public.integrante set papel = 'membro' where nome = 'Matheus';
  set constraints all immediate;
  raise exception 'FALHOU: igreja ficou sem admin';
exception when check_violation then raise notice 'ok: a igreja não fica sem admin';
end $$;
reset role;

-- Integridade e regras de negócio
do $$ begin
  insert into public.escala_item (igreja_id, culto_id, funcao_id, integrante_id, posicao)
    select c.igreja_id, c.id, f.id, i.id, 1 from public.culto c, public.funcao f, public.integrante i
    where c.data = '2026-11-22' and f.nome = 'Vocal' and i.nome = 'Grazi' and f.igreja_id = c.igreja_id and i.igreja_id = c.igreja_id
    limit 1;
  update public.escala_item set posicao = 4 where funcao_id = (select id from public.funcao where nome = 'Vocal');
  raise exception 'FALHOU: aceitou 4º vocal';
exception when check_violation then raise notice 'ok: no máximo 3 vocais por culto';
end $$;
do $$ begin
  insert into public.integrante_funcao (igreja_id, integrante_id, funcao_id, periodo)
    select '00000000-0000-0000-0000-0000000000aa', i.id, f.id, 'noite'
    from public.integrante i, public.funcao f where i.nome = 'Grazi' and f.nome = 'Baixo';
  raise exception 'FALHOU: misturou igrejas';
exception when foreign_key_violation then raise notice 'ok: não mistura dados de igrejas diferentes';
end $$;
select teste.checar(
  (select count(*) = 1 from public.musica where busca like '%felicidade no servico%'),
  'busca ignora acentos');
select teste.checar(
  (select count(*) = 1 from public.musica where busca like '%satisfeito, abencoado%'),
  'busca encontra trecho da letra');
select teste.checar(
  (select repertorio_publicado_em is not null from public.culto where data = '2026-11-15'),
  'publicação registra a data');
delete from public.musica where titulo = 'Exaltai';
select teste.checar(
  (select count(*) = 5 from public.setlist_item where culto_id = (select id from public.culto where data = '2026-11-15')),
  'excluir a música a tira também dos repertórios antigos');
-- Reordenar o setlist numa transação (unique adiável)
update public.setlist_item set ordem = 7 - ordem
  where culto_id = (select id from public.culto where data = '2026-11-15');
select teste.checar(
  (select m.titulo = 'Grande É o Senhor' from public.setlist_item s join public.musica m on m.id = s.musica_id
   where s.ordem = 1 and s.culto_id = (select id from public.culto where data = '2026-11-15')),
  'setlist pode ser reordenado');

select teste.checar(
  (select tem_cifra and not (select tem_cifra from public.musica where titulo = 'Exaltai')
   from public.musica where titulo = 'Felicidade no Serviço'),
  'tem_cifra indica quais músicas têm cifra');

-- salvar_repertorio: admin salva tudo de uma vez; membro não consegue
select teste.como('lider@exemplo.com');
select public.salvar_repertorio(
  (select id from public.culto where data = '2026-11-22'),
  jsonb_build_array(
    jsonb_build_object('musica_id', (select id from public.musica where titulo = 'Grande É o Senhor'), 'tom', 'A', 'observacao', 'só piano no início'),
    jsonb_build_object('musica_id', (select id from public.musica where titulo = 'Felicidade no Serviço'), 'tom', '')
  ),
  '  Ceia no final  ');
reset role;
select teste.checar(
  (select string_agg(m.titulo || ':' || coalesce(s.tom, '-'), ', ' order by s.ordem)
   from public.setlist_item s join public.musica m on m.id = s.musica_id
   where s.culto_id = (select id from public.culto where data = '2026-11-22'))
  = 'Grande É o Senhor:A, Felicidade no Serviço:-',
  'salvar_repertorio grava ordem e tom');
select teste.checar(
  (select observacoes = 'Ceia no final' from public.culto where data = '2026-11-22'),
  'salvar_repertorio grava observações gerais');
select teste.como('breno@exemplo.com');
do $$ begin
  perform public.salvar_repertorio((select id from public.culto where data = '2026-11-22'), '[]'::jsonb, '');
  raise exception 'FALHOU: membro alterou repertório';
exception when insufficient_privilege then raise notice 'ok: membro não altera repertório';
end $$;
reset role;

-- Cadastro pela própria pessoa (link da equipe)
insert into auth.users (email, email_confirmed_at) values ('nova@exemplo.com', now());
insert into auth.users (email, email_confirmed_at) values ('grazi@exemplo.com', now());
update public.integrante set email = 'grazi@exemplo.com' where nome = 'Grazi' and usuario_id is null;
update public.integrante set usuario_id = null where nome = 'Grazi'; -- simula cadastro feito antes do 1º login
select codigo_convite as codigo from public.igreja where slug = 'louvor' \gset
select teste.anonimo();
select teste.checar(
  public.igreja_do_convite(:'codigo') = 'Ministério de Louvor',
  'visitante vê o nome da igreja de um convite válido');
select teste.checar(public.igreja_do_convite('errado') is null, 'convite inválido não revela nada');
reset role;
select teste.como('nova@exemplo.com');
do $$ begin
  perform public.entrar_na_equipe('errado', 'Nova', '');
  raise exception 'FALHOU: entrou com convite inválido';
exception when no_data_found then raise notice 'ok: convite inválido é recusado';
end $$;
select teste.checar(
  public.entrar_na_equipe(:'codigo', ' Nova Pessoa ', '(11) 90000-0000') = 'pendente',
  'quem entra pelo link fica pendente');
select teste.checar((select count(*) = 1 from public.integrante where usuario_id = (select auth.uid())), 'pendente vê o próprio cadastro');
select teste.checar((select count(*) = 0 from public.musica), 'pendente não vê o acervo');
select public.atualizar_meu_perfil(
  (select igreja_id from public.integrante where usuario_id = (select auth.uid())), 'Nova P.', '(11) 98888-0000');
reset role;
select teste.checar(
  (select nome = 'Nova P.' and telefone = '(11) 98888-0000' and email = 'nova@exemplo.com' and not aprovado and not ativo
   from public.integrante where email = 'nova@exemplo.com'),
  'perfil pendente com nome, e-mail do login e WhatsApp');
select teste.como('grazi@exemplo.com');
select teste.checar(
  public.entrar_na_equipe(:'codigo', 'Grazi R', '') = 'aprovado',
  'quem o líder já cadastrou pelo e-mail entra direto, sem nova aprovação');
select teste.checar((select count(*) = 5 from public.musica), 'cadastro do líder ligado pelo link já vê o acervo');
reset role;
-- aprovar (como líder) libera o acesso
select teste.como('lider@exemplo.com');
update public.integrante set aprovado = true, ativo = true where email = 'nova@exemplo.com';
select public.registrar_acesso((select id from public.igreja where slug = 'louvor'));
select teste.checar((select count(*) = 1 from public.acesso_integrante), 'líder vê o último acesso');
reset role;
select teste.como('nova@exemplo.com');
select teste.checar((select count(*) = 5 from public.musica), 'depois de aprovado vê o acervo');
select public.registrar_acesso((select igreja_id from public.integrante where usuario_id = (select auth.uid())));
select teste.checar((select count(*) = 0 from public.acesso_integrante), 'membro não vê o último acesso de ninguém');
do $$ begin
  update public.integrante set papel = 'admin' where usuario_id = (select auth.uid());
  if exists (select 1 from public.integrante where usuario_id = (select auth.uid()) and papel = 'admin') then
    raise exception 'FALHOU: membro se promoveu';
  end if;
  raise notice 'ok: membro não muda o próprio papel';
end $$;
do $$ begin
  perform public.renovar_convite((select igreja_id from public.integrante where usuario_id = (select auth.uid())));
  raise exception 'FALHOU: membro renovou o convite';
exception when insufficient_privilege then raise notice 'ok: só líder renova o convite';
end $$;
reset role;
select teste.checar((select count(*) = 2 from public.acesso_integrante), 'acessos registrados para líder e membro');

-- Avisos (push e e-mail)
reset role;
select teste.como('breno@exemplo.com');
insert into public.inscricao_push (endpoint, p256dh, auth) values ('https://push.exemplo.com/breno', 'chave', 'segredo');
select teste.checar((select count(*) = 1 from public.inscricao_push), 'membro cria e vê a própria inscrição de aviso');
do $$ begin
  insert into public.inscricao_push (endpoint, usuario_id, p256dh, auth)
    values ('https://push.exemplo.com/falsa', (select id from auth.users where email = 'lider@exemplo.com'), 'x', 'y');
  raise exception 'FALHOU: membro criou inscrição em nome de outro';
exception when insufficient_privilege then raise notice 'ok: inscrição só em nome próprio';
end $$;
select public.definir_avisos_email((select igreja_id from public.integrante where nome = 'Breno'), false);
select teste.checar((select not avisos_email from public.integrante where nome = 'Breno'), 'membro desliga o próprio aviso por e-mail');
do $$ begin
  perform * from public.avisos_destinatarios((select igreja_id from public.integrante where nome = 'Breno'), '{}');
  raise exception 'FALHOU: membro leu destinatários';
exception when insufficient_privilege then raise notice 'ok: só líder lê destinatários dos avisos';
end $$;
do $$ begin
  perform * from public.avisos_inscricoes((select igreja_id from public.integrante where nome = 'Breno'), '{}');
  raise exception 'FALHOU: membro leu inscrições';
exception when insufficient_privilege then raise notice 'ok: só líder lê inscrições dos avisos';
end $$;

reset role;
select teste.como('lider@exemplo.com');
select teste.checar((select count(*) = 0 from public.inscricao_push), 'líder não lê a tabela de inscrições dos outros');
select teste.checar(
  (select count(*) = 1 and bool_and(email is null) and bool_and(funcao = 'Bateria')
   from public.avisos_destinatarios(
     (select igreja_id from public.integrante where nome = 'Breno'),
     array(select id from public.culto where data = '2026-11-22'))
   where nome = 'Breno'),
  'líder vê o escalado e respeita o e-mail desligado');
select teste.checar(
  (select count(*) = 1 from public.avisos_inscricoes(
     (select igreja_id from public.integrante where nome = 'Breno'),
     array(select id from public.integrante where nome = 'Breno'))),
  'líder recebe a inscrição do escalado para enviar');
do $$ begin
  perform * from public.avisos_inscricoes('00000000-0000-0000-0000-0000000000aa', '{}');
  raise exception 'FALHOU: líder leu inscrições de outra igreja';
exception when insufficient_privilege then raise notice 'ok: líder não lê avisos de outra igreja';
end $$;
select public.avisos_remover_inscricoes((select igreja_id from public.integrante where nome = 'Breno'), array['https://push.exemplo.com/breno']);
reset role;
select teste.checar((select count(*) = 0 from public.inscricao_push), 'inscrição vencida removida pelo envio');

-- Funções auxiliares não ficam na API pública
select teste.checar(
  not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef
      and p.proname not in ('igreja_do_convite', 'entrar_na_equipe', 'atualizar_meu_perfil', 'registrar_acesso', 'renovar_convite',
                            'definir_avisos_email', 'avisos_destinatarios', 'avisos_inscricoes', 'avisos_remover_inscricoes')
  ),
  'só as funções de convite/perfil/acesso/avisos são security definer na API (intencional)');

\echo 'TODOS OS TESTES DE BANCO PASSARAM'
