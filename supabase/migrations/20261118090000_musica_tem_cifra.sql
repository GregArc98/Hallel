-- A lista do acervo mostra se a música tem cifra sem precisar baixar o texto inteiro.
alter table public.musica
  add column tem_cifra boolean generated always as (coalesce(btrim(cifra), '') <> '') stored;
