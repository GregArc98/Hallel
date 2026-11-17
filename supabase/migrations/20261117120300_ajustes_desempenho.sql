-- Ajustes apontados pelo verificador de desempenho do Supabase.

-- 1) Políticas de admin "for all" também valiam para SELECT, somando-se às de leitura
--    dos membros (o Postgres avalia as duas). Admins já são membros, então a leitura
--    fica só na política de membros e as de admin passam a cobrir apenas escrita.
do $$
declare
  alvo record;
begin
  for alvo in
    select * from (values
      ('funcao', 'admins gerenciam funções'),
      ('integrante_funcao', 'admins gerenciam funções dos integrantes'),
      ('musica', 'admins gerenciam o acervo'),
      ('culto', 'admins gerenciam cultos'),
      ('escala_item', 'admins gerenciam escalas'),
      ('setlist_item', 'admins gerenciam repertórios')
    ) as t(tabela, politica)
  loop
    execute format('drop policy %I on public.%I', alvo.politica, alvo.tabela);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (privado.e_admin(igreja_id))',
      alvo.politica || ' (inserir)', alvo.tabela);
    execute format(
      'create policy %I on public.%I for update to authenticated using (privado.e_admin(igreja_id)) with check (privado.e_admin(igreja_id))',
      alvo.politica || ' (alterar)', alvo.tabela);
    execute format(
      'create policy %I on public.%I for delete to authenticated using (privado.e_admin(igreja_id))',
      alvo.politica || ' (apagar)', alvo.tabela);
  end loop;
end $$;

-- 2) Índices para as chaves estrangeiras compostas (id, igreja_id).
create index escala_item_culto_fk_idx on public.escala_item (culto_id, igreja_id);
create index escala_item_funcao_fk_idx on public.escala_item (funcao_id, igreja_id);
create index escala_item_integrante_fk_idx on public.escala_item (integrante_id, igreja_id);
drop index public.escala_item_integrante_idx;
create index indisponibilidade_integrante_fk_idx on public.indisponibilidade (integrante_id, igreja_id);
create index integrante_funcao_funcao_fk_idx on public.integrante_funcao (funcao_id, igreja_id);
create index integrante_funcao_integrante_fk_idx on public.integrante_funcao (integrante_id, igreja_id);
create index musica_criado_por_idx on public.musica (criado_por);
create index setlist_item_culto_fk_idx on public.setlist_item (culto_id, igreja_id);
create index setlist_item_musica_fk_idx on public.setlist_item (musica_id, igreja_id);
drop index public.setlist_item_musica_idx;
