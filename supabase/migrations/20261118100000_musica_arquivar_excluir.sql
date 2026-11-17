-- Músicas podem ser ARQUIVADAS (somem do acervo, continuam nos cultos antigos)
-- ou EXCLUÍDAS de vez (saem também dos repertórios antigos).
alter table public.musica add column arquivada boolean not null default false;

alter table public.setlist_item
  drop constraint setlist_item_musica_id_igreja_id_fkey,
  add constraint setlist_item_musica_id_igreja_id_fkey
    foreign key (musica_id, igreja_id) references public.musica (id, igreja_id) on delete cascade;
