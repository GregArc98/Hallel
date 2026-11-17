-- Tira as funções auxiliares de permissão da API pública (/rest/v1/rpc).
-- As políticas de RLS continuam usando-as (referência por OID, nada muda nelas).
-- vincular_minha_conta() sai: os gatilhos já vinculam conta ⇄ integrante nos dois sentidos.

create schema if not exists privado;
revoke all on schema privado from public;
grant usage on schema privado to authenticated;

alter function public.minhas_igrejas() set schema privado;
alter function public.e_membro(uuid) set schema privado;
alter function public.e_admin(uuid) set schema privado;
alter function public.meu_integrante(uuid) set schema privado;

alter function public.integrante_vincular_conta() set schema privado;
alter function public.usuario_vincular_integrantes() set schema privado;
alter function public.garantir_admin() set schema privado;

drop function public.vincular_minha_conta();
