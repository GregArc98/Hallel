-- Salva o repertório inteiro de um culto numa única transação (ordem, tom e
-- observações), mais as observações gerais do culto. SECURITY INVOKER: as regras
-- de RLS valem normalmente; a checagem de admin é só para dar uma mensagem clara.
create function public.salvar_repertorio(p_culto uuid, p_itens jsonb, p_observacoes text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_igreja uuid;
begin
  select igreja_id into v_igreja from public.culto where id = p_culto;
  if v_igreja is null or not privado.e_admin(v_igreja) then
    raise exception 'Apenas líderes podem alterar o repertório' using errcode = '42501';
  end if;
  if jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) > 40 then
    raise exception 'Repertório inválido' using errcode = '22023';
  end if;

  update public.culto set observacoes = nullif(btrim(p_observacoes), '') where id = p_culto;
  delete from public.setlist_item where culto_id = p_culto;
  insert into public.setlist_item (igreja_id, culto_id, musica_id, ordem, tom, observacao)
  select v_igreja, p_culto, (e ->> 'musica_id')::uuid, t.ord::int,
         nullif(btrim(e ->> 'tom'), ''), nullif(btrim(e ->> 'observacao'), '')
  from jsonb_array_elements(p_itens) with ordinality as t(e, ord);
end;
$$;

revoke execute on function public.salvar_repertorio(uuid, jsonb, text) from public, anon;
grant execute on function public.salvar_repertorio(uuid, jsonb, text) to authenticated;
