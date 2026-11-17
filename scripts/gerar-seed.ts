/**
 * Gera supabase/seed.sql a partir de src/data/seed.ts.
 * Uso: npm run db:seed:gerar
 *
 * IDs determinísticos (derivados do nome) para o seed poder ser reaplicado e referenciado.
 */
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { CULTOS, FUNCOES, IGREJA, INTEGRANTES, MUSICAS } from "../src/data/seed";
import { parseChordsOverLyrics, serializeChordPro, songToPlainLyrics } from "../src/lib/music";

function uuid(...parts: string[]): string {
  const h = createHash("sha1").update(["hallel-seed", ...parts].join(":")).digest("hex");
  // Formato UUID v5 (versão 5, variante RFC 4122).
  return [
    h.slice(0, 8),
    h.slice(8, 12),
    "5" + h.slice(13, 16),
    ((parseInt(h.slice(16, 18), 16) & 0x3f) | 0x80).toString(16) + h.slice(18, 20),
    h.slice(20, 32),
  ].join("-");
}

function lit(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "number") return String(value);
  return `'${value.replace(/'/g, "''")}'`;
}

function textArray(values: string[]): string {
  return values.length ? `array[${values.map(lit).join(", ")}]::text[]` : "'{}'::text[]";
}

const igrejaId = uuid("igreja", IGREJA.slug);
const funcaoId = (nome: string) => uuid("funcao", IGREJA.slug, nome);
const integranteId = (nome: string) => uuid("integrante", IGREJA.slug, nome);
const musicaId = (titulo: string) => uuid("musica", IGREJA.slug, titulo);
const cultoId = (data: string, periodo: string) => uuid("culto", IGREJA.slug, data, periodo);

const out: string[] = [];
out.push(
  "-- Gerado por scripts/gerar-seed.ts a partir de src/data/seed.ts. Não edite à mão.",
  "-- Para banco recém-criado (as migrações já aplicadas).",
  "begin;",
  "",
  `insert into public.igreja (id, nome, slug) values (${lit(igrejaId)}, ${lit(IGREJA.nome)}, ${lit(IGREJA.slug)});`,
  "",
  "insert into public.funcao (id, igreja_id, nome, ordem, max_por_culto, modo_padrao) values",
  FUNCOES.map(
    (f, i) =>
      `  (${lit(funcaoId(f.nome))}, ${lit(igrejaId)}, ${lit(f.nome)}, ${i + 1}, ${f.max}, ${lit(f.modo)})`,
  ).join(",\n") + ";",
  "",
  "insert into public.integrante (id, igreja_id, nome) values",
  INTEGRANTES.map((p) => `  (${lit(integranteId(p.nome))}, ${lit(igrejaId)}, ${lit(p.nome)})`).join(
    ",\n",
  ) + ";",
  "",
  "insert into public.integrante_funcao (igreja_id, integrante_id, funcao_id, periodo) values",
  INTEGRANTES.flatMap((p) =>
    Object.entries(p.funcoes).flatMap(([funcao, periodos]) =>
      (periodos ?? []).map(
        (per) =>
          `  (${lit(igrejaId)}, ${lit(integranteId(p.nome))}, ${lit(funcaoId(funcao))}, ${lit(per)})`,
      ),
    ),
  ).join(",\n") + ";",
  "",
);

out.push(
  "insert into public.musica (id, igreja_id, titulo, tom_original, hinario_numero, hinario_sigla, tags, cifra, letra) values",
  MUSICAS.map((m) => {
    let cifra: string | null = null;
    let letra: string | null = null;
    if (m.cifraTexto) {
      const song = parseChordsOverLyrics(m.cifraTexto);
      song.meta.title = m.titulo; // título bonito em vez do CAIXA ALTA do documento
      cifra = serializeChordPro(song);
      letra = songToPlainLyrics(song);
    }
    return `  (${[
      lit(musicaId(m.titulo)),
      lit(igrejaId),
      lit(m.titulo),
      lit(m.tom),
      lit(m.hinario?.numero),
      lit(m.hinario?.sigla),
      textArray(m.tags ?? []),
      lit(cifra),
      lit(letra),
    ].join(", ")})`;
  }).join(",\n") + ";",
  "",
);

for (const c of CULTOS) {
  const id = cultoId(c.data, c.periodo);
  out.push(
    `insert into public.culto (id, igreja_id, data, periodo, escala_publicada, repertorio_publicado) values (${lit(id)}, ${lit(igrejaId)}, ${lit(c.data)}, ${lit(c.periodo)}, true, true);`,
    "insert into public.escala_item (igreja_id, culto_id, funcao_id, integrante_id, posicao) values",
    Object.entries(c.escala)
      .flatMap(([funcao, nomes]) =>
        (nomes ?? []).map(
          (nome, i) =>
            `  (${lit(igrejaId)}, ${lit(id)}, ${lit(funcaoId(funcao))}, ${lit(integranteId(nome))}, ${i + 1})`,
        ),
      )
      .join(",\n") + ";",
    "insert into public.setlist_item (igreja_id, culto_id, musica_id, ordem, tom, observacao) values",
    c.setlist
      .map(
        (s, i) =>
          `  (${lit(igrejaId)}, ${lit(id)}, ${lit(musicaId(s.titulo))}, ${i + 1}, ${lit(s.tom)}, ${lit(s.observacao)})`,
      )
      .join(",\n") + ";",
    "",
  );
}

out.push("commit;", "");

const target = join(import.meta.dirname, "..", "supabase", "seed.sql");
writeFileSync(target, out.join("\n"));
console.log(`seed gerado em ${target}`);
