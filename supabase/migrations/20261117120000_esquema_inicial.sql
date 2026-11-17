-- Hallel — esquema inicial
-- Toda tabela carrega igreja_id (tenant). Chaves estrangeiras compostas
-- (id, igreja_id) garantem que nada de uma igreja aponte para outra.

create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
create type public.papel as enum ('admin', 'membro');
create type public.periodo as enum ('manha', 'noite');
create type public.tipo_culto as enum ('regular', 'avulso');
create type public.modo_exibicao as enum ('cifra', 'letra');

-- ---------------------------------------------------------------------------
-- Utilitários
-- ---------------------------------------------------------------------------

-- unaccent "imutável" para poder ser usado em colunas geradas e índices.
create function public.sem_acento(texto text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select lower(extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(texto, '')))
$$;

create function public.definir_atualizado_em()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Igreja (tenant)
-- ---------------------------------------------------------------------------
create table public.igreja (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (btrim(nome) <> ''),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  fuso_horario text not null default 'America/Sao_Paulo',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Integrante: pessoa da equipe. usuario_id é preenchido no 1º login (pelo e-mail).
-- ---------------------------------------------------------------------------
create table public.integrante (
  id uuid primary key default gen_random_uuid(),
  igreja_id uuid not null references public.igreja (id) on delete cascade,
  usuario_id uuid references auth.users (id) on delete set null,
  nome text not null check (btrim(nome) <> ''),
  email text check (email = lower(btrim(email)) and email like '%@%'),
  telefone text,
  papel public.papel not null default 'membro',
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (id, igreja_id),
  unique (igreja_id, usuario_id)
);
create unique index integrante_igreja_email_key on public.integrante (igreja_id, email);
create index integrante_usuario_idx on public.integrante (usuario_id);
create index integrante_email_idx on public.integrante (email);

-- ---------------------------------------------------------------------------
-- Função (Bateria, Baixo, Vocal...)
-- ---------------------------------------------------------------------------
create table public.funcao (
  id uuid primary key default gen_random_uuid(),
  igreja_id uuid not null references public.igreja (id) on delete cascade,
  nome text not null check (btrim(nome) <> ''),
  ordem smallint not null default 0,
  max_por_culto smallint not null default 1 check (max_por_culto between 1 and 10),
  -- Como a cifra abre para quem exerce a função (vocal/ministração → letra).
  modo_padrao public.modo_exibicao not null default 'cifra',
  criado_em timestamptz not null default now(),
  unique (id, igreja_id),
  unique (igreja_id, nome)
);

-- Quem exerce cada função, e em qual período.
create table public.integrante_funcao (
  igreja_id uuid not null,
  integrante_id uuid not null,
  funcao_id uuid not null,
  periodo public.periodo not null,
  primary key (integrante_id, funcao_id, periodo),
  foreign key (integrante_id, igreja_id) references public.integrante (id, igreja_id) on delete cascade,
  foreign key (funcao_id, igreja_id) references public.funcao (id, igreja_id) on delete cascade
);
create index integrante_funcao_funcao_idx on public.integrante_funcao (funcao_id, periodo);

-- ---------------------------------------------------------------------------
-- Música (acervo)
-- ---------------------------------------------------------------------------
create table public.musica (
  id uuid primary key default gen_random_uuid(),
  igreja_id uuid not null references public.igreja (id) on delete cascade,
  titulo text not null check (btrim(titulo) <> ''),
  artista text,
  hinario_numero integer check (hinario_numero > 0),
  hinario_sigla text,
  tom_original text,
  bpm smallint check (bpm between 20 and 300),
  tags text[] not null default '{}',
  -- Cifra em ChordPro (o app converte de/para "acorde em cima da letra").
  cifra text,
  -- Letra sem acordes. Gerada pelo app a partir da cifra, ou digitada se não houver cifra.
  letra text,
  audio_url text,
  audio_url_externo text,
  youtube_url text,
  observacoes text,
  criado_por uuid references auth.users (id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  -- Texto para busca sem acento (título, artista, número do hinário e letra).
  busca text generated always as (
    public.sem_acento(
      titulo || ' ' || coalesce(artista, '') || ' ' || coalesce(hinario_numero::text, '')
        || ' ' || coalesce(hinario_sigla, '') || ' ' || coalesce(letra, '')
    )
  ) stored,
  unique (id, igreja_id)
);
create index musica_igreja_idx on public.musica (igreja_id, titulo);
create index musica_busca_trgm_idx on public.musica using gin (busca extensions.gin_trgm_ops);
create index musica_tags_idx on public.musica using gin (tags);

-- ---------------------------------------------------------------------------
-- Culto
-- ---------------------------------------------------------------------------
create table public.culto (
  id uuid primary key default gen_random_uuid(),
  igreja_id uuid not null references public.igreja (id) on delete cascade,
  data date not null,
  periodo public.periodo not null,
  tipo public.tipo_culto not null default 'regular',
  titulo text,
  horario time,
  observacoes text,
  escala_publicada boolean not null default false,
  escala_publicada_em timestamptz,
  repertorio_publicado boolean not null default false,
  repertorio_publicado_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (id, igreja_id)
);
-- Só um culto regular por data e período; avulsos podem coincidir.
create unique index culto_regular_key on public.culto (igreja_id, data, periodo)
  where tipo = 'regular';
create index culto_data_idx on public.culto (igreja_id, data);

-- Escala: quem toca o quê em cada culto. posicao > 1 para funções com várias vagas (Vocal).
create table public.escala_item (
  id uuid primary key default gen_random_uuid(),
  igreja_id uuid not null,
  culto_id uuid not null,
  funcao_id uuid not null,
  integrante_id uuid not null,
  posicao smallint not null default 1 check (posicao >= 1),
  criado_em timestamptz not null default now(),
  unique (culto_id, funcao_id, posicao),
  foreign key (culto_id, igreja_id) references public.culto (id, igreja_id) on delete cascade,
  foreign key (funcao_id, igreja_id) references public.funcao (id, igreja_id) on delete cascade,
  foreign key (integrante_id, igreja_id) references public.integrante (id, igreja_id) on delete cascade
);
create index escala_item_integrante_idx on public.escala_item (integrante_id);

-- Repertório (setlist) do culto, ordenado, com o tom daquele culto.
create table public.setlist_item (
  id uuid primary key default gen_random_uuid(),
  igreja_id uuid not null,
  culto_id uuid not null,
  musica_id uuid not null,
  ordem integer not null check (ordem >= 1),
  tom text,
  observacao text,
  criado_em timestamptz not null default now(),
  -- Adiável para permitir reordenar várias linhas numa única transação.
  constraint setlist_item_ordem_key unique (culto_id, ordem) deferrable initially deferred,
  foreign key (culto_id, igreja_id) references public.culto (id, igreja_id) on delete cascade,
  -- restrict: música usada em culto não some do histórico.
  foreign key (musica_id, igreja_id) references public.musica (id, igreja_id) on delete restrict
);
create index setlist_item_musica_idx on public.setlist_item (musica_id);

-- Datas em que o integrante não pode. periodo nulo = o dia todo.
create table public.indisponibilidade (
  id uuid primary key default gen_random_uuid(),
  igreja_id uuid not null,
  integrante_id uuid not null,
  data date not null,
  periodo public.periodo,
  motivo text,
  criado_em timestamptz not null default now(),
  foreign key (integrante_id, igreja_id) references public.integrante (id, igreja_id) on delete cascade
);
create unique index indisponibilidade_key on public.indisponibilidade (integrante_id, data, periodo)
  nulls not distinct;
create index indisponibilidade_data_idx on public.indisponibilidade (igreja_id, data);

-- ---------------------------------------------------------------------------
-- Gatilhos de atualizado_em
-- ---------------------------------------------------------------------------
create trigger igreja_atualizado_em before update on public.igreja
  for each row execute function public.definir_atualizado_em();
create trigger integrante_atualizado_em before update on public.integrante
  for each row execute function public.definir_atualizado_em();
create trigger musica_atualizado_em before update on public.musica
  for each row execute function public.definir_atualizado_em();
create trigger culto_atualizado_em before update on public.culto
  for each row execute function public.definir_atualizado_em();

-- Escala respeita o limite de vagas da função (ex.: até 3 vocais).
create function public.validar_posicao_escala()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  limite smallint;
begin
  select max_por_culto into limite from public.funcao where id = new.funcao_id;
  if new.posicao > limite then
    raise exception 'A função permite no máximo % pessoa(s) por culto', limite
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;
create trigger escala_item_valida_posicao before insert or update on public.escala_item
  for each row execute function public.validar_posicao_escala();
