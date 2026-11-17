#!/usr/bin/env bash
# Testa migrações + seed + regras de acesso num Postgres local temporário.
# Requer Postgres 15+ instalado (initdb/pg_ctl/psql no PATH ou em /usr/lib/postgresql/*/bin).
set -euo pipefail
cd "$(dirname "$0")/../.."

PGBIN="$(dirname "$(command -v initdb 2>/dev/null || ls -d /usr/lib/postgresql/*/bin/initdb | tail -1)")"
DIR="$(mktemp -d)"
PORT="${PGPORT_TESTE:-54329}"
# O Postgres não roda como root: nesse caso usa o usuário de sistema "postgres".
AS=()
if [ "$(id -u)" = "0" ]; then
  chown postgres "$DIR"
  AS=(runuser -u postgres --)
fi
trap '"${AS[@]}" "$PGBIN/pg_ctl" -D "$DIR/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$DIR"' EXIT

"${AS[@]}" "$PGBIN/initdb" -D "$DIR/data" -U postgres -A trust >/dev/null
"${AS[@]}" "$PGBIN/pg_ctl" -D "$DIR/data" -o "-p $PORT -k $DIR" -l "$DIR/log" start -w >/dev/null

PSQL=("$PGBIN/psql" -h "$DIR" -p "$PORT" -U postgres -d postgres -v ON_ERROR_STOP=1 -q)
"${PSQL[@]}" -f scripts/db/supabase-stub.sql
for f in supabase/migrations/*.sql; do
  echo "migração: $f"
  "${PSQL[@]}" -f "$f"
done
echo "seed: supabase/seed.sql"
"${PSQL[@]}" -f supabase/seed.sql
"${PSQL[@]}" -t -A -f scripts/db/teste-rls.sql 2>&1 | sed -n 's/^psql:[^ ]* NOTICE:  /  /p; /PASSARAM/p; /ERROR/p; /FALHOU/p'
# pipefail garante que um erro do psql derruba o script mesmo com o filtro acima
