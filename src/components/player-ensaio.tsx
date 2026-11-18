"use client";

import {
  Download,
  Link2,
  Link2Off,
  Loader2,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  RotateCw,
  Share2,
} from "lucide-react";
import { useCallback, useContext, useEffect, useRef, useState } from "react";

import { TomDaCifra } from "@/components/chord-sheet/tom-context";
import { Button } from "@/components/ui/button";
import { usePreference } from "@/hooks/use-preference";
import {
  LIMITE_SEMITONS,
  PULO_SEGUNDOS,
  VELOCIDADES,
  formatarTempo,
  nomeDoArquivo,
  pular,
  rotuloSemitons,
  semitonsDoAudio,
} from "@/lib/audio/ensaio";
import { transposeKey } from "@/lib/music";
import { cn } from "@/lib/utils";

const PROCESSADOR = "/soundtouch-processor.js";

interface Motor {
  contexto: AudioContext;
  no: AudioWorkletNode & { pitchSemitones: AudioParam; playbackRate: AudioParam };
}

/**
 * Player de ensaio para áudios enviados ao Hallel: tocar/pausar, voltar/avançar 10s,
 * velocidade (sem mudar o tom) e tom − / + (acompanhando a cifra, se estiver num visualizador).
 *
 * O tom é mudado no próprio aparelho (SoundTouch, num AudioWorklet). O áudio só passa pelo
 * processamento quando o tom sai do original — até lá, é o player nativo do navegador.
 */
export function PlayerEnsaio({ url, titulo, tomOriginal }: { url: string; titulo: string; tomOriginal: string | null }) {
  const offsetCifra = useContext(TomDaCifra);
  const audio = useRef<HTMLAudioElement>(null);
  const motor = useRef<Motor | null>(null);
  const [tocando, setTocando] = useState(false);
  const [tempo, setTempo] = useState(0);
  const [duracao, setDuracao] = useState(0);
  const [acompanha, setAcompanha] = useState(offsetCifra !== null);
  const [manual, setManual] = useState(0);
  const [velocidade, setVelocidade] = usePreference<number>("ensaio.velocidade", 1);
  const [preparando, setPreparando] = useState(false);
  const [semTom, setSemTom] = useState<string | null>(null);
  const [arquivo, setArquivo] = useState<"livre" | "baixando" | "erro">("livre");

  const semitons = semTom ? 0 : semitonsDoAudio(acompanha, offsetCifra, manual);
  const tomAtual = tomOriginal ? transposeKey(tomOriginal, semitons) : null;
  const podeCompartilhar = typeof navigator !== "undefined" && "share" in navigator && "canShare" in navigator;

  /** Liga o processamento de tom (uma vez por player). */
  const ligarMotor = useCallback(async (): Promise<Motor | null> => {
    if (motor.current) return motor.current;
    const el = audio.current;
    if (!el) return null;
    setPreparando(true);
    try {
      const { SoundTouchNode } = await import("@soundtouchjs/audio-worklet");
      const contexto = new AudioContext();
      await SoundTouchNode.register(contexto, PROCESSADOR);

      // Para o navegador entregar o som ao processamento, o áudio precisa ser lido com CORS.
      if (el.crossOrigin !== "anonymous") {
        const posicao = el.currentTime;
        const estavaTocando = !el.paused;
        el.crossOrigin = "anonymous";
        el.src = url;
        await new Promise<void>((ok, falha) => {
          el.addEventListener("loadedmetadata", () => ok(), { once: true });
          el.addEventListener("error", () => falha(new Error("cors")), { once: true });
        });
        el.currentTime = posicao;
        if (estavaTocando) void el.play();
      }

      const no = new SoundTouchNode({ context: contexto }) as Motor["no"];
      contexto.createMediaElementSource(el).connect(no);
      no.connect(contexto.destination);
      motor.current = { contexto, no };
      return motor.current;
    } catch (erro) {
      console.warn("Hallel: não foi possível ligar a mudança de tom do áudio", erro);
      // Sem permissão de leitura (CORS) ou navegador sem AudioWorklet: volta ao player normal.
      el.removeAttribute("crossorigin");
      el.src = url;
      setSemTom("Este áudio não permite mudar o tom aqui. Toque no tom original ou use o Moises.");
      return null;
    } finally {
      setPreparando(false);
    }
  }, [url]);

  // Aplica tom e velocidade sempre que mudam.
  useEffect(() => {
    const el = audio.current;
    if (!el) return;
    el.playbackRate = velocidade;
    if (motor.current) {
      el.preservesPitch = false; // o SoundTouch cuida do tom
      motor.current.no.playbackRate.value = velocidade;
      motor.current.no.pitchSemitones.value = semitons;
    } else {
      el.preservesPitch = true; // velocidade sem mudar o tom, pelo próprio navegador
      // Liga o processamento logo depois desta renderização (ex.: o tom da cifra mudou).
      if (semitons !== 0) void Promise.resolve().then(ligarMotor).then((m) => {
        if (m) {
          el.preservesPitch = false;
          m.no.playbackRate.value = velocidade;
          m.no.pitchSemitones.value = semitons;
        }
      });
    }
  }, [semitons, velocidade, ligarMotor]);

  useEffect(
    () => () => {
      void motor.current?.contexto.close().catch(() => {});
    },
    [],
  );

  async function alternar() {
    const el = audio.current;
    if (!el) return;
    if (motor.current?.contexto.state === "suspended") await motor.current.contexto.resume();
    if (el.paused) await el.play().catch(() => {});
    else el.pause();
  }

  function mudarTom(delta: number) {
    const base = semitonsDoAudio(acompanha, offsetCifra, manual);
    setAcompanha(false);
    setManual(Math.max(-LIMITE_SEMITONS, Math.min(LIMITE_SEMITONS, base + delta)));
  }

  async function obterArquivo(): Promise<File | null> {
    setArquivo("baixando");
    try {
      const r = await fetch(url, { mode: "cors" });
      if (!r.ok) throw new Error();
      const blob = await r.blob();
      setArquivo("livre");
      return new File([blob], nomeDoArquivo(titulo, tomOriginal, url), { type: blob.type || "audio/mpeg" });
    } catch {
      setArquivo("erro");
      return null;
    }
  }

  async function compartilhar() {
    const f = await obterArquivo();
    if (!f) return;
    if (navigator.canShare?.({ files: [f] })) {
      await navigator.share({ files: [f], title: titulo }).catch(() => {});
    } else {
      salvar(f);
    }
  }

  function salvar(f: File) {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(f);
    link.download = f.name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 10_000);
  }

  async function baixar() {
    const f = await obterArquivo();
    if (f) salvar(f);
    else window.open(`${url}?download=1`, "_blank", "noopener");
  }

  return (
    <div className="space-y-3">
      <audio
        ref={audio}
        src={url}
        preload="metadata"
        onPlay={() => setTocando(true)}
        onPause={() => setTocando(false)}
        onEnded={() => setTocando(false)}
        onTimeUpdate={(e) => setTempo(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuracao(e.currentTarget.duration)}
        onDurationChange={(e) => setDuracao(e.currentTarget.duration)}
      />

      <div className="flex items-center justify-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => audio.current && (audio.current.currentTime = pular(audio.current.currentTime, -PULO_SEGUNDOS, duracao))}
          aria-label="Voltar 10 segundos"
          className="w-auto gap-1 px-3"
        >
          <RotateCcw /> <span className="text-xs font-semibold">10s</span>
        </Button>
        <Button type="button" size="icon" className="size-14 rounded-full" onClick={alternar} aria-label={tocando ? "Pausar" : "Tocar"}>
          {preparando ? <Loader2 className="size-6 animate-spin" /> : tocando ? <Pause className="size-6" /> : <Play className="size-6" />}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => audio.current && (audio.current.currentTime = pular(audio.current.currentTime, PULO_SEGUNDOS, duracao))}
          aria-label="Avançar 10 segundos"
          className="w-auto gap-1 px-3"
        >
          <span className="text-xs font-semibold">10s</span> <RotateCw />
        </Button>
      </div>

      <div className="flex items-center gap-3 text-sm tabular-nums">
        <span className="w-12 text-right">{formatarTempo(tempo)}</span>
        <input
          type="range"
          min={0}
          max={duracao || 0}
          step={0.5}
          value={Math.min(tempo, duracao || 0)}
          onChange={(e) => audio.current && (audio.current.currentTime = Number(e.target.value))}
          aria-label="Posição na música"
          className="h-2 flex-1 accent-primary"
        />
        <span className="w-12 text-muted-foreground">{formatarTempo(duracao)}</span>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-1" role="group" aria-label="Tom do áudio">
          <span className="mr-1 text-sm text-muted-foreground">Tom do áudio</span>
          <Button type="button" variant="outline" size="icon-sm" onClick={() => mudarTom(-1)} disabled={!!semTom} aria-label="Baixar meio tom do áudio">
            <Minus />
          </Button>
          <span className="min-w-16 text-center text-sm font-semibold" aria-live="polite">
            {tomAtual ? <span className="text-chord">{tomAtual}</span> : null}{" "}
            <span className="text-muted-foreground">({rotuloSemitons(semitons)})</span>
          </span>
          <Button type="button" variant="outline" size="icon-sm" onClick={() => mudarTom(1)} disabled={!!semTom} aria-label="Subir meio tom do áudio">
            <Plus />
          </Button>
          {offsetCifra !== null && !semTom && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setAcompanha((a) => !a)}
              aria-pressed={acompanha}
              title={acompanha ? "O áudio segue o tom da cifra" : "Tom do áudio independente da cifra"}
              className={cn(acompanha && "text-primary")}
            >
              {acompanha ? <Link2 /> : <Link2Off />} {acompanha ? "Segue a cifra" : "Separado"}
            </Button>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Velocidade</span>
          <select
            value={velocidade}
            onChange={(e) => setVelocidade(Number(e.target.value))}
            className="h-9 rounded-lg border bg-background px-2"
          >
            {VELOCIDADES.map((v) => (
              <option key={v} value={v}>
                {String(v).replace(".", ",")}×
              </option>
            ))}
          </select>
        </label>
      </div>

      {semitons !== 0 && Math.abs(semitons) > 3 && !semTom && (
        <p className="text-xs text-muted-foreground">Acima de 3 semitons a voz pode soar artificial.</p>
      )}
      {semTom && <p className="text-sm text-amber-700 dark:text-amber-400">{semTom}</p>}

      <div className="flex flex-wrap gap-2 border-t pt-3">
        {podeCompartilhar && (
          <Button type="button" variant="outline" size="sm" onClick={compartilhar} disabled={arquivo === "baixando"}>
            <Share2 /> Abrir no Moises / Compartilhar
          </Button>
        )}
        <Button type="button" variant="ghost" size="sm" onClick={baixar} disabled={arquivo === "baixando"}>
          {arquivo === "baixando" ? <Loader2 className="animate-spin" /> : <Download />} Baixar áudio
        </Button>
        {arquivo === "erro" && <span className="text-sm text-amber-700 dark:text-amber-400">Não foi possível preparar o arquivo.</span>}
      </div>
    </div>
  );
}
