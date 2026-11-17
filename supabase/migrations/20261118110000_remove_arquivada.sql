-- Decisão revista: sem "arquivar". Música sai do acervo só excluindo (o que também
-- a tira dos repertórios antigos, via on delete cascade).
alter table public.musica drop column arquivada;
