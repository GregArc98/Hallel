"use client";

import { Save, Wand2 } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useActionState, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { allKeys, parseFileName, parseKey, parseSongText } from "@/lib/music";
import type { CamposMusica } from "@/lib/musicas/formulario";
import { cn } from "@/lib/utils";
import { type EstadoFormulario, salvarMusica } from "./actions";
import { AudioCampo } from "./audio-campo";
import { CifraEditor } from "./cifra-editor";

export type ValoresMusica = Record<CamposMusica, string> & { id?: string };

const VAZIO: ValoresMusica = {
  titulo: "",
  artista: "",
  hinario_numero: "",
  hinario_sigla: "",
  tom_original: "",
  bpm: "",
  tags: "",
  cifra_texto: "",
  letra_texto: "",
  audio_url: "",
  audio_url_externo: "",
  youtube_url: "",
  observacoes: "",
};

const TONS_MAIORES = allKeys(false);
const TONS_MENORES = allKeys(true);

const classeCampo =
  "h-11 w-full rounded-lg border bg-background px-3 text-base outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive";

function Campo({
  rotulo,
  erro,
  dica,
  children,
  className,
}: {
  rotulo: string;
  erro?: string;
  dica?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-sm font-medium">{rotulo}</span>
      {children}
      {dica && !erro && <span className="block text-xs text-muted-foreground">{dica}</span>}
      {erro && <span className="block text-sm text-destructive">{erro}</span>}
    </label>
  );
}

export function MusicaForm({
  igrejaId,
  uploadHabilitado,
  musica,
}: {
  igrejaId: string;
  uploadHabilitado: boolean;
  musica?: ValoresMusica;
}) {
  const inicial = musica ?? VAZIO;
  const [estado, acao, salvando] = useActionState<EstadoFormulario, FormData>(salvarMusica, {});
  const erros = estado.erros ?? {};

  // Campos que o app pode preencher sozinho (pelo nome do arquivo ou pela cifra).
  const [titulo, setTitulo] = useState(inicial.titulo);
  const [tom, setTom] = useState(inicial.tom_original);
  const [hinarioNumero, setHinarioNumero] = useState(inicial.hinario_numero);
  const [hinarioSigla, setHinarioSigla] = useState(inicial.hinario_sigla);
  const [cifra, setCifra] = useState(inicial.cifra_texto);
  const [nomeArquivo, setNomeArquivo] = useState("");

  const detectado = useMemo(() => {
    if (!cifra.trim()) return null;
    const meta = parseSongText(cifra).meta;
    return {
      tom: meta.key && parseKey(meta.key) ? meta.key : null,
      titulo: meta.title ?? null,
    };
  }, [cifra]);

  function preencherPeloArquivo() {
    const info = parseFileName(nomeArquivo);
    if (info.title) setTitulo(info.title);
    if (info.key) setTom(info.key);
    if (info.hymnNumber) setHinarioNumero(String(info.hymnNumber));
    if (info.hymnal) setHinarioSigla(info.hymnal);
    setNomeArquivo("");
  }

  const tomInvalido = tom && !TONS_MAIORES.includes(tom) && !TONS_MENORES.includes(tom);

  return (
    <form action={acao} className="space-y-6" noValidate>
      {inicial.id && <input type="hidden" name="id" value={inicial.id} />}

      {!inicial.id && (
        <div className="rounded-xl border border-dashed p-3">
          <label htmlFor="nome-arquivo" className="text-sm font-medium">
            Veio do Drive? Cole o nome do arquivo
          </label>
          <div className="mt-1.5 flex gap-2">
            <input
              id="nome-arquivo"
              value={nomeArquivo}
              onChange={(e) => setNomeArquivo(e.target.value)}
              placeholder="Felicidade no Serviço - 410 CC - TOM E"
              className={classeCampo}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={preencherPeloArquivo}
              disabled={!nomeArquivo.trim()}
            >
              <Wand2 /> Preencher
            </Button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Preenche título, hinário e tom a partir do nome.
          </p>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2">
        <Campo rotulo="Título *" erro={erros.titulo} className="sm:col-span-2">
          <input
            name="titulo"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
            aria-invalid={erros.titulo ? true : undefined}
            className={classeCampo}
          />
        </Campo>
        <Campo rotulo="Artista / autor" erro={erros.artista}>
          <input name="artista" defaultValue={inicial.artista} className={classeCampo} />
        </Campo>
        <Campo rotulo="Tom original" erro={erros.tom_original}>
          <select
            name="tom_original"
            value={tom}
            onChange={(e) => setTom(e.target.value)}
            aria-invalid={erros.tom_original ? true : undefined}
            className={classeCampo}
          >
            <option value="">Não informado</option>
            {tomInvalido && <option value={tom}>{tom}</option>}
            <optgroup label="Maiores">
              {TONS_MAIORES.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </optgroup>
            <optgroup label="Menores">
              {TONS_MENORES.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </optgroup>
          </select>
        </Campo>
        <div className="grid grid-cols-[1fr_6rem] gap-3">
          <Campo rotulo="Nº no hinário" erro={erros.hinario_numero}>
            <input
              name="hinario_numero"
              inputMode="numeric"
              value={hinarioNumero}
              onChange={(e) => setHinarioNumero(e.target.value)}
              className={classeCampo}
            />
          </Campo>
          <Campo rotulo="Hinário" erro={erros.hinario_sigla}>
            <input
              name="hinario_sigla"
              value={hinarioSigla}
              onChange={(e) => setHinarioSigla(e.target.value)}
              placeholder="CC"
              className={classeCampo}
            />
          </Campo>
        </div>
        <Campo rotulo="BPM" erro={erros.bpm}>
          <input name="bpm" inputMode="numeric" defaultValue={inicial.bpm} className={classeCampo} />
        </Campo>
        <Campo
          rotulo="Tags"
          erro={erros.tags}
          dica="Separe por vírgula: adoração, celebração, ceia"
          className="sm:col-span-2"
        >
          <input name="tags" defaultValue={inicial.tags} className={classeCampo} />
        </Campo>
      </section>

      <section className="space-y-2">
        <CifraEditor valor={cifra} onChange={setCifra} erro={erros.cifra_texto} />
        {detectado?.tom && detectado.tom !== tom && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm">
            A cifra diz <strong>Tom: {detectado.tom}</strong>.
            <Button type="button" size="sm" variant="secondary" onClick={() => setTom(detectado.tom!)}>
              Usar {detectado.tom}
            </Button>
          </div>
        )}
        {detectado?.titulo && !titulo.trim() && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm">
            Título encontrado na cifra: <strong>{detectado.titulo}</strong>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setTitulo(detectado.titulo!)}
            >
              Usar
            </Button>
          </div>
        )}
      </section>

      {!cifra.trim() && (
        <Campo
          rotulo="Letra (sem cifra)"
          erro={erros.letra_texto}
          dica="Só se a música não tiver cifra. Com cifra, a letra é gerada sozinha."
        >
          <textarea
            name="letra_texto"
            defaultValue={inicial.letra_texto}
            rows={8}
            className="w-full rounded-lg border bg-background p-3 text-base outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
        </Campo>
      )}

      <section className="space-y-4 rounded-xl border p-4">
        <h2 className="font-semibold">Áudio e vídeo</h2>
        <AudioCampo igrejaId={igrejaId} inicial={inicial.audio_url} habilitado={uploadHabilitado} />
        <Campo
          rotulo="Link do áudio (Google Drive ou outro)"
          erro={erros.audio_url_externo}
          dica="Opcional. Útil enquanto os áudios ainda estão no Drive."
        >
          <input
            name="audio_url_externo"
            type="url"
            inputMode="url"
            defaultValue={inicial.audio_url_externo}
            className={classeCampo}
          />
        </Campo>
        <Campo rotulo="Link do YouTube" erro={erros.youtube_url}>
          <input
            name="youtube_url"
            type="url"
            inputMode="url"
            defaultValue={inicial.youtube_url}
            className={classeCampo}
          />
        </Campo>
      </section>

      <Campo rotulo="Observações" erro={erros.observacoes}>
        <textarea
          name="observacoes"
          defaultValue={inicial.observacoes}
          rows={3}
          className="w-full rounded-lg border bg-background p-3 text-base outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
      </Campo>

      {estado.erro && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {estado.erro}
        </p>
      )}

      <div className="sticky bottom-[var(--nav-h,0px)] z-10 -mx-4 flex gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur">
        <Button type="submit" size="lg" disabled={salvando} className="flex-1 sm:flex-none">
          <Save /> {salvando ? "Salvando…" : "Salvar"}
        </Button>
        <Button asChild variant="ghost" size="lg">
          <Link href={inicial.id ? `/musicas/${inicial.id}` : "/musicas"}>Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
