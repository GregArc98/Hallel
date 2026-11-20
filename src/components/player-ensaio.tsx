"use client";

import {
  Download,
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
import { type MotorTom, criarMotor } from "@/lib/audio/motores";
import { transposeKey } from "@/lib/music";

interface Base {
  contexto: AudioContext;
  /** Saída do player nativo, ligada ao motor de tom. */
  fonte: MediaElementAudioSourceNode;
}

/**
 * Player de ensaio para áudios enviados ao Hallel: tocar/pausar, voltar/avançar 10s,
 * velocidade (sem mudar o tom) e tom (o da cifra, se estiver num visualizador).
 *
 * O tom é mudado no próprio aparelho (ver lib/audio/motores), preservando o timbre da voz. O
 * áudio só passa pelo processamento quando o tom sai do original — até lá, é o player nativo.
 */
export function PlayerEnsaio({ url, titulo, tomOriginal }: { url: string; titulo: string; tomOriginal: string | null }) {
  const offsetCifra = useContext(TomDaCifra);
  const audio = useRef<HTMLAudioElement>(null);
  const base = useRef<Base | null>(null);
  /** Criado no primeiro toque em ▶ (navegadores, principalmente o iPhone, só liberam áudio assim). */
  const contextoRef = useRef<AudioContext | null>(null);
  const motor = useRef<MotorTom | null>(null);
  /** Ligação em andamento — vários toques seguidos no − / + esperam a mesma. */
  const ligando = useRef<Promise<MotorTom | null> | null>(null);
  const [tocando, setTocando] = useState(false);
  const [tempo, setTempo] = useState(0);
  const [duracao, setDuracao] = useState(0);
  /** Dentro da cifra o áudio sempre toca no tom dela (o − / + fica lá em cima). */
  const naCifra = offsetCifra !== null;
  const [manual, setManual] = useState(0);
  const [velocidade, setVelocidade] = usePreference<number>("ensaio.velocidade", 1);
  const [preparando, setPreparando] = useState(false);
  const [semTom, setSemTom] = useState<string | null>(null);
  const [arquivo, setArquivo] = useState<"livre" | "baixando" | "erro">("livre");

  const semitons = semTom ? 0 : semitonsDoAudio(naCifra, offsetCifra, manual);
  const tomAtual = tomOriginal ? transposeKey(tomOriginal, semitons) : null;

  /** Liga o motor de tom (uma vez só). */
  const ligarMotor = useCallback((): Promise<MotorTom | null> => {
    if (motor.current) return Promise.resolve(motor.current);
    ligando.current ??= ligarAgora().finally(() => {
      ligando.current = null;
    });
    return ligando.current;

    async function ligarAgora(): Promise<MotorTom | null> {
      const el = audio.current;
      if (!el) return null;
      setPreparando(true);
      try {
        if (!base.current) {
          const contexto = contextoRef.current ?? new AudioContext();
          contextoRef.current = contexto;
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
          base.current = { contexto, fonte: contexto.createMediaElementSource(el) };
        }
        // O processamento só "acorda" com o áudio ativo; sem isso o motor nunca fica pronto.
        if (base.current.contexto.state === "suspended") await base.current.contexto.resume().catch(() => {});
        motor.current = await criarMotor(base.current.contexto, base.current.fonte);
        return motor.current;
      } catch (erro) {
        console.warn("Hallel: não foi possível ligar a mudança de tom do áudio", erro);
        if (!base.current) {
          // Sem permissão de leitura (CORS) ou navegador sem AudioWorklet: volta ao player normal.
          el.removeAttribute("crossorigin");
          el.src = url;
          setSemTom("Este áudio não permite mudar o tom aqui. Toque no tom original ou use o Moises.");
        } else {
          setSemTom("Não foi possível mudar o tom neste aparelho. Toque no tom original ou use o Moises.");
        }
        return null;
      } finally {
        setPreparando(false);
      }
    }
  }, [url]);

  // Aplica tom e velocidade sempre que mudam.
  useEffect(() => {
    const el = audio.current;
    if (!el) return;
    el.playbackRate = velocidade;
    const aplicar = (m: MotorTom | null) => {
      if (!m) return;
      el.preservesPitch = false; // o motor cuida do tom
      m.aplicar(semitons, velocidade);
    };
    if (motor.current) {
      aplicar(motor.current);
    } else if (semitons !== 0) {
      el.preservesPitch = true;
      // Liga o processamento logo depois desta renderização (ex.: o tom da cifra mudou).
      void Promise.resolve()
        .then(() => ligarMotor())
        .then(aplicar);
    } else {
      el.preservesPitch = true; // velocidade sem mudar o tom, pelo próprio navegador
    }
  }, [semitons, velocidade, ligarMotor]);

  useEffect(
    () => () => {
      motor.current?.desligar();
      void contextoRef.current?.close().catch(() => {});
    },
    [],
  );

  async function alternar() {
    const el = audio.current;
    if (!el) return;
    if (!contextoRef.current && typeof AudioContext !== "undefined") contextoRef.current = new AudioContext();
    if (contextoRef.current?.state === "suspended") void contextoRef.current.resume();
    if (el.paused) await el.play().catch(() => {});
    else el.pause();
  }

  function mudarTom(delta: number) {
    setManual((m) => Math.max(-LIMITE_SEMITONS, Math.min(LIMITE_SEMITONS, m + delta)));
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

  const [dicaMoises, setDicaMoises] = useState(false);

  /** Celular: abre o compartilhar com o arquivo (escolha o Moises). Computador: baixa e abre o Moises. */
  async function abrirNoMoises() {
    // Abre a aba já no clique (navegadores bloqueiam abas abertas depois de um download).
    const podeCompartilhar = typeof navigator.canShare === "function";
    const aba = podeCompartilhar ? null : window.open("about:blank", "_blank");
    const f = await obterArquivo();
    if (!f) {
      aba?.close();
      return;
    }
    if (podeCompartilhar && navigator.canShare({ files: [f] })) {
      await navigator.share({ files: [f], title: titulo }).catch(() => {});
      return;
    }
    salvar(f);
    setDicaMoises(true);
    if (aba) aba.location.href = "https://moises.ai/";
    else window.open("https://moises.ai/", "_blank", "noopener");
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
        {naCifra ? (
          <p className="text-sm" aria-live="polite">
            <span className="text-muted-foreground">Tocando em </span>
            <strong className="text-chord">{tomAtual ?? rotuloSemitons(semitons)}</strong>
            <span className="text-muted-foreground"> — o tom da cifra</span>
          </p>
        ) : (
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
          </div>
        )}

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

      {semTom && <p className="text-sm text-amber-700 dark:text-amber-400">{semTom}</p>}

      <div className="flex flex-wrap gap-2 border-t pt-3">
        <Button type="button" variant="outline" size="sm" onClick={abrirNoMoises} disabled={arquivo === "baixando"}>
          <Share2 /> Abrir no Moises
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={baixar} disabled={arquivo === "baixando"}>
          {arquivo === "baixando" ? <Loader2 className="animate-spin" /> : <Download />} Baixar áudio
        </Button>
        {dicaMoises && (
          <p className="w-full text-sm text-muted-foreground">
            Áudio baixado. No Moises, toque em <strong>Upload</strong> e escolha o arquivo
            &quot;{nomeDoArquivo(titulo, tomOriginal, url)}&quot;.
          </p>
        )}
        {arquivo === "erro" && <span className="text-sm text-amber-700 dark:text-amber-400">Não foi possível preparar o arquivo.</span>}
      </div>
    </div>
  );
}
